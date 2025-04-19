import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useVehicleStore } from "@/store/vehicleStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusSimple } from "@fortawesome/free-solid-svg-icons";
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import LocationButton from "./LocationButton";
import { createPortal } from "react-dom";
import BusStops from "./BusStops";
import RouteShape from "./RouteShape";
import {
  RouteShape as RouteShapeType,
  parseShapes,
  parseTrips,
  buildRouteShapes,
  parseStopTimes,
} from "@/lib/routeUtil";

interface MapProps {
  center?: [number, number];
  zoom?: number;
  selectedRoute: string;
}

// Component to handle map zooming when route changes
function MapController({ selectedRoute }: { selectedRoute: string }) {
  const map = useMap();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const mapRef = useRef(map);
  const [stopsData, setStopsData] = useState<string>("");
  const [stopTimeData, setStopTimeData] = useState<string>("");

  // Track if we've already zoomed for the current route selection
  const [hasZoomed, setHasZoomed] = useState(false);

  // Update map reference when map changes
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  // Reset zoom state when route changes
  useEffect(() => {
    setHasZoomed(false);
  }, [selectedRoute]);

  // Fetch stops data when route changes
  useEffect(() => {
    if (selectedRoute === "all" || hasZoomed) return;

    Promise.all([
      fetch("/api/stops").then((res) => res.text()),
      fetch("/api/stop_times").then((res) => res.text()),
    ])
      .then(([stops, stopTimes]) => {
        setStopsData(stops);
        setStopTimeData(stopTimes);
      })
      .catch((err) => {
        console.error("Error fetching stops data:", err);
      });
  }, [selectedRoute, hasZoomed]);

  // Zoom to show all stops for the route
  useEffect(() => {
    if (!hasZoomed && selectedRoute !== "all" && stopsData && stopTimeData) {
      try {
        // Find relevant trip IDs for this route
        const routeVehicles = vehicles.filter(
          (v) => v.routeId === selectedRoute
        );
        if (routeVehicles.length === 0) return;

        // Get trip IDs for the route
        const tripIds = routeVehicles.map((v) => v.tripId);

        // Parse stop times to get stop IDs for these trips
        const parsedTripToStops = parseStopTimes(stopTimeData);
        const stopIdsForRoute = new Set<string>();

        for (const tripId of tripIds) {
          if (parsedTripToStops.has(tripId)) {
            const stopSequences = parsedTripToStops.get(tripId)!;
            stopSequences.forEach((item) => stopIdsForRoute.add(item.stopId));
          }
        }

        // Parse stops to get coordinates
        const stopLines = stopsData
          .split("\n")
          .filter((line) => line.trim().length > 0);

        // Use a plain JavaScript object instead of Map
        const stopsMap: Record<string, { lat: number; lng: number }> = {};

        // Skip header row and parse the data
        stopLines.slice(1).forEach((line) => {
          const values = line.split(",");
          // Use object property instead of Map.set()
          stopsMap[values[0]] = {
            lat: parseFloat(values[3]),
            lng: parseFloat(values[4]),
          };
        });

        // Get coordinates for all stops in this route
        const stopCoords = Array.from(stopIdsForRoute)
          .map((stopId) => stopsMap[stopId])
          .filter((coord) => coord && !isNaN(coord.lat) && !isNaN(coord.lng));

        if (stopCoords.length > 0) {
          // Calculate bounding box for all stops
          const bounds = stopCoords.reduce(
            (box, coord) => {
              return {
                minLat: Math.min(box.minLat, coord.lat),
                maxLat: Math.max(box.maxLat, coord.lat),
                minLng: Math.min(box.minLng, coord.lng),
                maxLng: Math.max(box.maxLng, coord.lng),
              };
            },
            {
              minLat: Infinity,
              maxLat: -Infinity,
              minLng: Infinity,
              maxLng: -Infinity,
            }
          );

          // Add padding to bounds
          const paddingFactor = 0.1;
          const latPadding = (bounds.maxLat - bounds.minLat) * paddingFactor;
          const lngPadding = (bounds.maxLng - bounds.minLng) * paddingFactor;

          // Set bounds on the map
          map.fitBounds(
            [
              [bounds.minLat - latPadding, bounds.minLng - lngPadding],
              [bounds.maxLat + latPadding, bounds.maxLng + lngPadding],
            ],
            { animate: true, duration: 1.5 }
          );

          // Mark that we've zoomed for this route selection
          setHasZoomed(true);
        }
      } catch (error) {
        console.error("Error processing stops for zooming:", error);
      }
    }
  }, [selectedRoute, stopsData, stopTimeData, vehicles, map, hasZoomed]);

  // Handle location found from LocationButton
  const handleLocationFound = useCallback(
    (coords: { lat: number; lng: number }) => {
      mapRef.current.flyTo([coords.lat, coords.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    },
    []
  );

  // Create a portal for the location button
  const [locationButtonPortal, setLocationButtonPortal] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the leaflet-control-container element after the map is mounted
    const controlContainer = document.querySelector(
      ".leaflet-control-container .leaflet-top.leaflet-right"
    );
    if (controlContainer) {
      // Create a new div for our custom control
      const locationControlDiv = document.createElement("div");
      locationControlDiv.className =
        "leaflet-control leaflet-bar my-location-control";
      controlContainer.appendChild(locationControlDiv);
      setLocationButtonPortal(locationControlDiv);

      // Cleanup function
      return () => {
        if (locationControlDiv.parentNode) {
          locationControlDiv.parentNode.removeChild(locationControlDiv);
        }
      };
    }
  }, [map]);

  return (
    <>
      {locationButtonPortal &&
        createPortal(
          <div className="p-1">
            <LocationButton onLocationFound={handleLocationFound} />
          </div>,
          locationButtonPortal
        )}
    </>
  );
}

export default function Map({
  center = [3.139, 101.6869], // Kuala Lumpur coordinates
  zoom = 12,
  selectedRoute = "all",
}: MapProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [stopsData, setStopsData] = useState<string>("");
  const [shapesData, setShapesData] = useState<string>("");
  const [tripsData, setTripsData] = useState<string>("");
  const [routeShapes, setRouteShapes] = useState<RouteShapeType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load stops.txt data
  useEffect(() => {
    if (selectedRoute === "all") return;
    fetch("/api/stops")
      .then((response) => response.text())
      .then((data) => {
        setStopsData(data);
      })
      .catch((error) => {
        console.error("Error loading stops data:", error);
      });
  }, [selectedRoute]);

  // Load shapes.txt data for route lines
  useEffect(() => {
    if (selectedRoute === "all") {
      setRouteShapes([]);
      return;
    }

    // Fetch the shapes data if we don't already have it
    if (!shapesData) {
      console.log("Fetching shapes data...");
      fetch("/api/shapes")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          console.log(`Received shapes data: ${data.length} bytes`);
          setShapesData(data);
        })
        .catch((error) => {
          console.error("Error loading shapes data:", error);
          setFetchError(`Shapes error: ${error.message}`);
        });
    }
  }, [selectedRoute, shapesData]);

  // Load trips.txt data for route-shape relationships
  useEffect(() => {
    if (selectedRoute === "all") return;

    // Fetch the trips data if we don't already have it
    if (!tripsData) {
      console.log("Fetching trips data...");
      fetch("/api/trips")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          console.log(`Received trips data: ${data.length} bytes`);
          setTripsData(data);
        })
        .catch((error) => {
          console.error("Error loading trips data:", error);
          setFetchError(`Trips error: ${error.message}`);
        });
    }
  }, [selectedRoute, tripsData]);

  // Process route shapes when data is available and route is selected
  useEffect(() => {
    if (selectedRoute === "all" || !shapesData || !tripsData) {
      setRouteShapes([]);
      return;
    }

    console.log("Processing route shape data...");
    console.log(`Selected route: ${selectedRoute}`);
    console.log(`Shapes data size: ${shapesData.length} bytes`);
    console.log(`Trips data size: ${tripsData.length} bytes`);

    try {
      // Check the first few lines of each file to confirm format
      const shapesLines = shapesData.split("\n").slice(0, 3);
      const tripsLines = tripsData.split("\n").slice(0, 3);

      console.log("Shapes data first lines:", shapesLines);
      console.log("Trips data first lines:", tripsLines);

      const shapePoints = parseShapes(shapesData);
      const tripToShapes = parseTrips(tripsData);

      // Find vehicles with the selected route ID
      const matchingVehicles = vehicles.filter(
        (v) => v.routeId === selectedRoute
      );

      if (matchingVehicles.length === 0) {
        console.warn(`No vehicles found for route ${selectedRoute}`);
        setFetchError(`No vehicles found for route ${selectedRoute}`);
        setRouteShapes([]);
        return;
      }

      // Use the trip ID from the first matching vehicle
      const selectedTripId = matchingVehicles[0].tripId;
      console.log(`Using trip ID ${selectedTripId} for route ${selectedRoute}`);

      // Check if the selected trip exists in our data
      if (!tripToShapes.has(selectedTripId)) {
        console.warn(`Trip ${selectedTripId} not found in trips data`);
        setFetchError(`Trip ID ${selectedTripId} not found in trips data`);
        setRouteShapes([]);
        return;
      }

      const shapes = buildRouteShapes(
        shapePoints,
        tripToShapes,
        selectedTripId
      );
      console.log(`Setting ${shapes.length} route shapes`);

      // Check if shapes have valid data
      if (shapes.length > 0) {
        const totalPoints = shapes.reduce(
          (sum, shape) => sum + shape.points.length,
          0
        );
        console.log(`Total points across all shapes: ${totalPoints}`);

        // Sample check of shape data
        const sampleShape = shapes[0];
        console.log(`Sample shape (${sampleShape.shape_id}) data:`, {
          route_id: sampleShape.route_id,
          points_count: sampleShape.points.length,
          first_point: sampleShape.points[0],
          last_point: sampleShape.points[sampleShape.points.length - 1],
        });
      }

      setRouteShapes(shapes);
    } catch (error) {
      console.error("Error processing route data:", error);
      setFetchError(`Processing error: ${(error as Error).message}`);
      setRouteShapes([]);
    }
  }, [selectedRoute, shapesData, tripsData, vehicles]);

  const filteredVehicles = useMemo(() => {
    return selectedRoute === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);
  }, [vehicles, selectedRoute]);

  const getBusIcon = (isActive: boolean) => {
    const iconHtml = renderToString(
      <FontAwesomeIcon
        icon={faBusSimple}
        style={{
          color: isActive ? "#0066cc" : "#000000",
          fontSize: "24px",
          opacity: isActive ? 1 : 0.8,
        }}
      />
    );
    return divIcon({
      html: iconHtml,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className="flex-1 h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0 relative"
      >
        <MapController selectedRoute={selectedRoute} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Display route shapes */}
        {selectedRoute !== "all" && routeShapes.length > 0 && (
          <RouteShape shapes={routeShapes} />
        )}

        {/* Display debug info */}
        {fetchError && (
          <div className="absolute top-0 right-0 bg-red-500 text-white p-2 z-1000">
            {fetchError}
          </div>
        )}

        {/* Display bus stops */}
        {selectedRoute !== "all" && stopsData && (
          <BusStops selectedRoute={selectedRoute} stopsData={stopsData} />
        )}

        {/* Display vehicles */}
        {filteredVehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicleId}
            position={[
              !isNaN(parseFloat(vehicle.latitude))
                ? parseFloat(vehicle.latitude)
                : 0,
              !isNaN(parseFloat(vehicle.longitude))
                ? parseFloat(vehicle.longitude)
                : 0,
            ]}
            icon={getBusIcon(vehicle.isActive)}
          >
            <Popup>
              <div>
                <p>Route: {vehicle.routeId}</p>
                <p>Vehicle ID: {vehicle.vehicleId}</p>
                <p>Status: {vehicle.status}</p>
                <p>
                  Last Updated: {new Date(vehicle.timestamp).toLocaleString()}
                </p>
                <p>
                  Status:{" "}
                  <span
                    className={
                      vehicle.isActive
                        ? "text-green-600 font-bold"
                        : "text-gray-500"
                    }
                  >
                    {vehicle.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
                {!vehicle.isActive && (
                  <p className="text-sm text-gray-500">
                    Last seen: {new Date(vehicle.lastSeen).toLocaleString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
