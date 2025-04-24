import { CircleMarker, Popup, useMap } from "react-leaflet";
import { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import { parseStopTimes } from "@/lib/routeUtil";
import { useVehicleStore } from "@/store/vehicleStore";
import React from "react";
import L from "leaflet"; // Added L import

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

// Define the type for the focus-stop event
interface FocusStopEventDetail {
  stopId: string;
  lat: number;
  lon: number;
}

interface FocusStopEvent extends CustomEvent {
  detail: FocusStopEventDetail;
}

export default function BusStops({ selectedRoute, stopsData }: BusStopsProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [relevantStopIds, setRelevantStopIds] = useState<Set<string>>(
    new Set()
  );
  const map = useMap(); // Get access to the Leaflet map instance
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedBusType = useVehicleStore((state) => state.selectedBusType);
  // Fix type definition to match what parseStopTimes actually returns
  const [tripToStopsMap, setTripToStopsMap] = useState<
    Map<string, Array<{ stopId: string; sequence: number }>>
  >(new Map());
  const [isStopTimesLoaded, setIsStopTimesLoaded] = useState(false);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);

  // Store references to all marker popups with proper typing
  const markerRefs = useMemo(() => new Map<string, L.CircleMarker>(), []);

  // Determine the bus type to use for API calls
  const busTypeParam = selectedBusType || "mrtfeeder";

  // Function to handle stop selection from the card, wrapped in useCallback
  const handleStopClick = useCallback((stop: Stop) => {
    // Validate coordinates before trying to fly to them
    if (isNaN(stop.stop_lat) || isNaN(stop.stop_lon)) {
      console.error("Invalid coordinates for stop:", stop);
      return;
    }

    // Close all popups first
    map.closePopup();

    // Fly to the stop location
    map.flyTo([stop.stop_lat, stop.stop_lon], 18, {
      animate: true,
      duration: 1,
    });

    // Set the active stop
    setActiveStopId(stop.stop_id);

    // Simply center on the stop and let the user click it
    // This is more reliable than trying to programmatically open the popup
  }, [map]); // Dependencies for useCallback

  // Listen for focus-stop events from MapWrapper
  useEffect(() => {
    const mapElement = document.querySelector(".leaflet-container");
    if (!mapElement) return;

    const handleFocusStopEvent = (e: FocusStopEvent) => {
      const { stopId, lat, lon } = e.detail;

      // Find the stop with this ID
      const stopToFocus = stops.find((stop) => stop.stop_id === stopId);
      if (stopToFocus) {
        handleStopClick(stopToFocus);
      } else if (!isNaN(lat) && !isNaN(lon)) {
        // If we can't find the stop, use the provided coordinates
        map.closePopup(); // Close any open popup
        map.flyTo([lat, lon], 18, {
          animate: true,
          duration: 1,
        });
      }
    };

    mapElement.addEventListener(
      "focus-stop",
      handleFocusStopEvent as EventListener
    );

    return () => {
      mapElement.removeEventListener(
        "focus-stop",
        handleFocusStopEvent as EventListener
      );
    };
  }, [map, stops, handleStopClick]);

  // Parse stops.txt data - do this first and only once when stopsData changes
  useEffect(() => {
    if (!stopsData) return;

    // Reset stop data when stopsData changes
    setStops([]);

    // Parse stops.txt content
    const stopLines = stopsData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    console.log(
      `Processing ${stopLines.length} stop lines for ${selectedRoute}`
    );

    // Skip header row and parse the data
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

    console.log(`Parsed ${parsedStops.length} stops for ${selectedRoute}`);
    setStops(parsedStops);
  }, [stopsData, selectedRoute]);

  // Fetch stop_times.txt data when bus type changes
  useEffect(() => {
    // Reset the flag to reload data when bus type changes
    setIsStopTimesLoaded(false);
  }, [busTypeParam]);

  // Fetch stop_times.txt data
  useEffect(() => {
    if (isStopTimesLoaded) return;

    console.log(`Fetching stop_times for bus type: ${busTypeParam}`);

    fetch(`/api/stop_times?busType=${busTypeParam}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log(
          `Received stop_times data: ${data.length} bytes for ${busTypeParam}`
        );
        // Parse the stop times data and store the mapping for reuse
        const parsedData = parseStopTimes(data);
        console.log(
          `Parsed stop_times data contains ${parsedData.size} trip entries`
        );
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
            stopIdsForRoute.add(item.stopId);
          }
        } else {
          console.log(
            `Trip ID not found in stop_times data: ${tripId} for route ${selectedRoute}`
          );
        }
      }

      console.log(
        `Found ${stopIdsForRoute.size} stops for route ${selectedRoute} (${busTypeParam})`
      );
      setRelevantStopIds(stopIdsForRoute);
    } else {
      console.log(`No vehicles found for route ${selectedRoute}`);
      setRelevantStopIds(new Set());
    }
  }, [
    selectedRoute,
    tripToStopsMap,
    vehicles,
    isStopTimesLoaded,
    busTypeParam,
  ]);

  // Memoize the filtered stops to avoid recalculating on every render
  const stopsToShow = useMemo(() => {
    if (selectedRoute === "all") return stops;

    const filtered = stops.filter((stop) => relevantStopIds.has(stop.stop_id));
    console.log(
      `Filtered ${filtered.length} stops out of ${stops.length} total stops for display`
    );

    return filtered;
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
            fillColor:
              activeStopId === stop.stop_id
                ? "#3498db" // Blue color for selected stop
                : selectedBusType === "kl"
                ? "#e74c3c" // Red for Rapid Bus KL stops
                : "#ff7800", // Orange for MRT Feeder stops
            fillOpacity: activeStopId === stop.stop_id ? 1.0 : 0.8,
            weight: activeStopId === stop.stop_id ? 2 : 1,
            color: activeStopId === stop.stop_id ? "#0000ff" : "#000",
            opacity: 1,
          }}
          className={`stop-${stop.stop_id}`}
          ref={(ref) => {
            // Store reference to the leaflet element
            if (ref) {
              markerRefs.set(stop.stop_id, ref);
            } else {
              markerRefs.delete(stop.stop_id);
            }
          }}
          eventHandlers={{
            click: () => {
              // Update active stop ID when clicked directly on map
              setActiveStopId(stop.stop_id);
            },
          }}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-bold text-base">{stop.stop_name}</h3>
              <p>Stop ID: {stop.stop_id}</p>
              <p>Stop Code: {stop.stop_code}</p>
              <p className="text-xs text-gray-500 mt-1">
                Bus Type: {busTypeParam}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
