import { CircleMarker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";
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
  const [stopsToShow, setStopsToShow] = useState<Stop[]>([]);
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Fetch stop_times.txt data
  useEffect(() => {
    if (selectedRoute === "all") return;

    fetch("/api/stop_times")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log(`Received stop_times data: ${data.length} bytes`);

        // Parse the stop times data directly without storing in state
        const parsedTripToStops = parseStopTimes(data);

        // Find relevant trip IDs for this route
        const routeVehicles = vehicles.filter(
          (v) => v.routeId === selectedRoute
        );
        if (routeVehicles.length > 0) {
          // Get all stop IDs for these trip IDs
          const stopIdsForRoute = new Set<string>();
          for (const vehicle of routeVehicles) {
            const tripId = vehicle.tripId;
            if (parsedTripToStops.has(tripId)) {
              const stopSequences = parsedTripToStops.get(tripId)!;
              stopSequences.forEach((item) => stopIdsForRoute.add(item.stopId));
            }
          }
          console.log(
            `Found ${stopIdsForRoute.size} stops for route ${selectedRoute}`
          );
          setRelevantStopIds(stopIdsForRoute);
        }
      })
      .catch((error) => {
        console.error("Error loading stop_times data:", error);
      });
  }, [selectedRoute, vehicles]);

  // Parse stops only once when stopsData changes
  useEffect(() => {
    if (!stopsData) return;

    console.time("parseStops");
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
    console.timeEnd("parseStops");

    setStops(parsedStops);
  }, [stopsData]);

  // Update filtered stops when relevantStopIds or stops change
  useEffect(() => {
    console.time("filterStops");
    const filteredStops =
      selectedRoute === "all"
        ? stops
        : stops.filter((stop) => relevantStopIds.has(stop.stop_id));
    setStopsToShow(filteredStops);
    console.timeEnd("filterStops");
  }, [selectedRoute, stops, relevantStopIds]);

  return (
    <>
      {stopsToShow.map((stop) => (
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
