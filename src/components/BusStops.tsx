import { CircleMarker, Popup } from "react-leaflet";
import { useState, useEffect, useMemo } from "react";
import { parseStopTimes } from "@/lib/routeUtil";
import { useVehicleStore } from "@/store/vehicleStore";

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

interface BusStopsProps {
  selectedRoute: string;
  stopsData?: string;
}

export default function BusStops({ selectedRoute, stopsData }: BusStopsProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [relevantStopIds, setRelevantStopIds] = useState<Set<string>>(
    new Set()
  );
  const vehicles = useVehicleStore((state) => state.vehicles);
  // Fix type definition to match what parseStopTimes actually returns
  const [tripToStopsMap, setTripToStopsMap] = useState<
    Map<string, Array<{ stopId: string; sequence: number }>>
  >(new Map());
  const [isStopTimesLoaded, setIsStopTimesLoaded] = useState(false);

  // Parse stops.txt data - do this first and only once when stopsData changes
  useEffect(() => {
    if (!stopsData) return;

    // Parse stops.txt content
    const stopLines = stopsData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Skip header row and parse the data
    const parsedStops = stopLines.slice(1).map((line) => {
      const values = line.split(",");
      return {
        stop_id: values[0],
        stop_code: values[1],
        stop_name: values[2],
        stop_lat: parseFloat(values[3]),
        stop_lon: parseFloat(values[4]),
      };
    });

    setStops(parsedStops);
  }, [stopsData]);

  // Fetch stop_times.txt data only once
  useEffect(() => {
    // If we've already loaded the data, don't do it again
    if (isStopTimesLoaded) return;

    fetch("/api/stop_times")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log(`Received stop_times data: ${data.length} bytes`);
        // Parse the stop times data and store the mapping for reuse
        const parsedData = parseStopTimes(data);
        setTripToStopsMap(parsedData);
        setIsStopTimesLoaded(true);
      })
      .catch((error) => {
        console.error("Error loading stop_times data:", error);
      });
  }, [isStopTimesLoaded]);

  // Find relevant stops based on selected route - do this when route or trip data changes
  useEffect(() => {
    if (selectedRoute === "all" || !isStopTimesLoaded) return;

    // Find relevant trip IDs for this route
    const routeVehicles = vehicles.filter((v) => v.routeId === selectedRoute);

    if (routeVehicles.length > 0) {
      // Get all stop IDs for these trip IDs - make this more efficient
      const stopIdsForRoute = new Set<string>();

      for (const vehicle of routeVehicles) {
        const tripId = vehicle.tripId;
        if (tripToStopsMap.has(tripId)) {
          const stopSequences = tripToStopsMap.get(tripId)!;
          for (const item of stopSequences) {
            // Using 'sequence' property instead of 'stopSequence'
            stopIdsForRoute.add(item.stopId);
          }
        }
      }

      console.log(
        `Found ${stopIdsForRoute.size} stops for route ${selectedRoute}`
      );
      setRelevantStopIds(stopIdsForRoute);
    }
  }, [selectedRoute, tripToStopsMap, vehicles, isStopTimesLoaded]);

  // Memoize the filtered stops to avoid recalculating on every render
  const stopsToShow = useMemo(() => {
    if (selectedRoute === "all") return stops;
    return stops.filter((stop) => relevantStopIds.has(stop.stop_id));
  }, [stops, selectedRoute, relevantStopIds]);

  // Limit the number of stops rendered at once for better performance
  const maxStopsToRender = 200; // Adjust this number based on performance testing
  const limitedStops = useMemo(() => {
    if (stopsToShow.length <= maxStopsToRender) return stopsToShow;
    // If we have too many stops, prioritize showing the relevant ones
    return stopsToShow.slice(0, maxStopsToRender);
  }, [stopsToShow]);

  return (
    <>
      {limitedStops.map((stop) => (
        <CircleMarker
          key={stop.stop_id}
          center={[stop.stop_lat, stop.stop_lon]}
          radius={5}
          pathOptions={{
            fillColor: "#ff7800",
            fillOpacity: 0.8,
            weight: 1,
            color: "#000",
            opacity: 1,
          }}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{stop.stop_name}</h3>
              <p>Stop ID: {stop.stop_id}</p>
              <p>Stop Code: {stop.stop_code}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
