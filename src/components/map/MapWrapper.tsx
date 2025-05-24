"use client";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect, useMemo } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStopTimes } from "@/lib/gtfs/routeUtil";
import { useIsMobile } from "@/hooks/use-mobile";
import RouteStopsInfo from "./RouteStopsInfo";

// Define proper types for stops data
interface StopData {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence?: number;
  isClonedAsFirst?: boolean;
  isDuplicate?: boolean;
}

export default function MapWrapper() {
  const isMobile = useIsMobile();
  const selectedRoute = useVehicleStore(
    (state) => state.selectedRoute || "all"
  );
  const selectedBusType = useVehicleStore((state) => state.selectedBusType);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [stopsData, setStopsData] = useState<StopData[]>([]);
  // Use a different name than 'Map' for the Map constructor
  const [tripToStopsMap, setTripToStopsMap] = useState<
    globalThis.Map<string, Array<{ stopId: string; sequence: number }>>
  >(new globalThis.Map());
  const [loadingStops, setLoadingStops] = useState(false);
  const [isStopTimesLoaded, setIsStopTimesLoaded] = useState(false);
  const [relevantStopIds, setRelevantStopIds] = useState<Set<string>>(
    new Set()
  );

  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // Determine the bus type to use for API calls
  const busTypeParam = selectedBusType || "mrtfeeder";

  // Effect to fetch stops data when component mounts or when bus type changes
  useEffect(() => {
    setLoadingStops(true);
    console.log(`Fetching stops data for bus type: ${busTypeParam}...`);

    fetch(`/api/stops?busType=${busTypeParam}`)
      .then((res) => res.text())
      .then((data) => {
        const stopLines = data
          .split("\n")
          .filter((line) => line.trim().length > 0);

        console.log(
          `Loaded ${stopLines.length - 1} stops for ${busTypeParam} buses`
        );

        // Skip the header line without storing it
        const parsedStops = stopLines.slice(1).map((line) => {
          const values = line.split(",");
          return {
            stop_id: values[0],
            stop_code: values[1] || "N/A",
            stop_name: values[2] || "Unknown",
            stop_lat: parseFloat(values[3]),
            stop_lon: parseFloat(values[4]),
          };
        });

        setStopsData(parsedStops);
        setLoadingStops(false);
      })
      .catch((error) => {
        console.error(`Error fetching stops data for ${busTypeParam}:`, error);
        setLoadingStops(false);
      });
  }, [busTypeParam]); // Refetch when bus type changes

  // Reset the stop times loaded flag when bus type changes
  useEffect(() => {
    setIsStopTimesLoaded(false);
  }, [busTypeParam]);

  // Fetch stop_times.txt data based on selected bus type
  useEffect(() => {
    if (isStopTimesLoaded) return;

    console.log(`Fetching stop_times data for bus type: ${busTypeParam}...`);

    fetch(`/api/stop_times?busType=${busTypeParam}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log(
          `Received ${data.length} bytes of stop_times data for ${busTypeParam}`
        );
        const parsedData = parseStopTimes(data);
        setTripToStopsMap(parsedData);
        setIsStopTimesLoaded(true);
      })
      .catch((error) => {
        console.error(
          `Error loading stop_times data for ${busTypeParam}:`,
          error
        );
      });
  }, [isStopTimesLoaded, busTypeParam]);

  // Find relevant stops based on selected route
  useEffect(() => {
    if (selectedRoute === "all" || !isStopTimesLoaded) return;

    // Find relevant trip IDs for this route
    const routeVehicles = vehicles.filter((v) => v.routeId === selectedRoute);

    if (routeVehicles.length > 0) {
      // Get all stop IDs for these trip IDs
      const stopIdsForRoute = new Set<string>();

      for (const vehicle of routeVehicles) {
        const tripId = vehicle.tripId;
        if (tripToStopsMap.has(tripId)) {
          const stopSequences = tripToStopsMap.get(tripId)!;
          for (const item of stopSequences) {
            stopIdsForRoute.add(item.stopId);
          }
        }
      }

      setRelevantStopIds(stopIdsForRoute);
    } else {
      setRelevantStopIds(new Set());
    }
  }, [selectedRoute, tripToStopsMap, vehicles, isStopTimesLoaded]);

  // Set up refresh for vehicle data only
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchVehicleData() {
      try {
        await loadVehiclesFromDatabase();
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      }
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase, selectedBusType]);

  // Memoize the dynamic Map component to prevent unnecessary re-creation
  const MapComponent = useMemo(
    () =>
      dynamic(() => import("./Map"), {
        ssr: false,
        loading: () => <p>Loading map...</p>,
      }),
    []
  );

  // Filter stops for the selected route and include sequence information
  const filteredStopsWithSequence = useMemo(() => {
    if (selectedRoute === "all") return [];

    // First, get all stops that are relevant to this route
    const relevantStops = stopsData.filter((stop) =>
      relevantStopIds.has(stop.stop_id)
    );

    // Create a map of stopId to sequence number
    const stopSequenceMap = new Map();

    // Find all trips for this route and their stop sequences
    const routeVehicles = vehicles.filter((v) => v.routeId === selectedRoute);

    // We'll get the first trip to determine order (assuming all trips follow similar order)
    if (routeVehicles.length > 0) {
      const firstVehicle = routeVehicles[0];
      const tripId = firstVehicle.tripId;

      if (tripToStopsMap.has(tripId)) {
        const stopSequences = tripToStopsMap.get(tripId)!;

        // Store the sequence for each stop
        stopSequences.forEach((item) => {
          stopSequenceMap.set(item.stopId, item.sequence);
        });
      }
    }

    // Annotate each stop with its sequence
    const stopsWithSequence = relevantStops.map((stop) => ({
      ...stop,
      sequence: stopSequenceMap.get(stop.stop_id) || 999999, // Default high value for unknown sequence
    }));

    // Sort by sequence number
    return stopsWithSequence.sort((a, b) => a.sequence - b.sequence);
  }, [stopsData, selectedRoute, relevantStopIds, tripToStopsMap, vehicles]);

  // Check if first and last stops are the same
  const isCircularRoute = useMemo(() => {
    if (filteredStopsWithSequence.length < 2) return false;
    const firstStop = filteredStopsWithSequence[0];
    const lastStop =
      filteredStopsWithSequence[filteredStopsWithSequence.length - 1];
    return firstStop.stop_id === lastStop.stop_id;
  }, [filteredStopsWithSequence]);

  // Prepare the display data by cloning the last stop and adding it as the first stop
  // but only for MRT feeder buses, not for KL buses
  const displayStops = useMemo(() => {
    if (filteredStopsWithSequence.length === 0) {
      return [];
    }

    // Only clone the last stop for MRT feeder buses
    if (filteredStopsWithSequence.length > 1 && busTypeParam === "mrtfeeder") {
      const lastStop =
        filteredStopsWithSequence[filteredStopsWithSequence.length - 1];
      const clonedLastStop = {
        ...lastStop,
        isClonedAsFirst: true,
        isDuplicate: true,
      };

      return [clonedLastStop, ...filteredStopsWithSequence];
    }

    return filteredStopsWithSequence;
  }, [filteredStopsWithSequence, busTypeParam]);

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full relative z-0">
        <Suspense fallback={<div>Loading...</div>}>
          <MapComponent selectedRoute={selectedRoute} />
        </Suspense>
      </div>

      {/* Bus stops information card - only shown on desktop */}
      {selectedRoute !== "all" && !isMobile && (
        <div className="absolute top-4 right-4 z-10 w-72 max-h-[70vh] overflow-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Route {selectedRoute} - Stops Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <RouteStopsInfo
                filteredStopsWithSequence={filteredStopsWithSequence}
                isCircularRoute={isCircularRoute}
                busTypeParam={busTypeParam}
                displayStops={displayStops}
                loadingStops={loadingStops}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
