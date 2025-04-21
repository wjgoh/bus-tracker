"use client";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect, useMemo } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStopTimes } from "@/lib/routeUtil";

// Define a proper type for the stop data
interface StopData {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence?: number;
  isTerminalEnd?: boolean;
  isDuplicate?: boolean;
}

export default function MapWrapper() {
  const selectedRoute = useVehicleStore(
    (state) => state.selectedRoute || "all"
  );
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

  // Effect to fetch stops data when component mounts (not when route changes)
  useEffect(() => {
    setLoadingStops(true);
    fetch("/api/stops")
      .then((res) => res.text())
      .then((data) => {
        const stopLines = data
          .split("\n")
          .filter((line) => line.trim().length > 0);
        // We can just skip storing the headers completely since we don't use them
        stopLines[0].split(","); // Parse header row but don't store it

        // Parse stops data
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
        console.error("Error fetching stops data:", error);
        setLoadingStops(false);
      });
  }, []); // Only fetch once when component mounts

  // Fetch stop_times.txt data only once
  useEffect(() => {
    if (isStopTimesLoaded) return;

    fetch("/api/stop_times")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        const parsedData = parseStopTimes(data);
        setTripToStopsMap(parsedData);
        setIsStopTimesLoaded(true);
      })
      .catch((error) => {
        console.error("Error loading stop_times data:", error);
      });
  }, [isStopTimesLoaded]);

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
      await loadVehiclesFromDatabase();
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase]);

  // Memoize the dynamic Map component to prevent unnecessary re-creation
  const MapComponent = useMemo(
    () =>
      dynamic(() => import("@/components/Map"), {
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

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full relative z-0">
        <Suspense fallback={<div>Loading...</div>}>
          <MapComponent selectedRoute={selectedRoute} />
        </Suspense>
      </div>

      {/* Bus stops information card */}
      {selectedRoute !== "all" && (
        <div className="absolute top-4 right-4 z-10 w-72 max-h-[70vh] overflow-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Route {selectedRoute} - Stops Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loadingStops ? (
                <p className="text-sm">Loading stops...</p>
              ) : filteredStopsWithSequence.length === 0 ? (
                <p className="text-sm">No stops found for this route.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    Showing all {filteredStopsWithSequence.length} stops in
                    sequence
                    {isCircularRoute && (
                      <span className="ml-1 text-xs italic">
                        (Circular route)
                      </span>
                    )}
                  </p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filteredStopsWithSequence.map((stop, index) => {
                      const isFirst = index === 0;
                      const isLast =
                        index === filteredStopsWithSequence.length - 1;
                      // Remove unused variable

                      // Don't filter out the last stop anymore - even for circular routes
                      return (
                        <div
                          key={`${stop.stop_id}-${index}`} // Add index to key to avoid duplicate key issues
                          className="text-xs p-2 bg-muted/50 rounded flex items-start"
                        >
                          <div className="mr-2 mt-0.5 flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {stop.stop_name}
                              {isFirst && (
                                <span
                                  className={`ml-1 ${
                                    isCircularRoute
                                      ? "text-purple-500"
                                      : "text-green-500"
                                  } font-bold`}
                                >
                                  {isCircularRoute
                                    ? "• Terminal Start"
                                    : "• First Stop"}
                                </span>
                              )}
                              {isLast && isCircularRoute && (
                                <span className="ml-1 text-purple-500 font-bold">
                                  • Terminal End
                                </span>
                              )}
                              {isLast && !isCircularRoute && (
                                <span className="ml-1 text-red-500 font-bold">
                                  • Last Stop
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              ID: {stop.stop_id}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* For circular routes, add a note about the route returning to the first stop */}
                  {isCircularRoute && (
                    <div className="text-xs italic text-muted-foreground pt-2">
                      Route returns to{" "}
                      {filteredStopsWithSequence[0]?.stop_name ||
                        "starting point"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
