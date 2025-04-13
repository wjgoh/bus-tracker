import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useVehicleStore } from "@/store/vehicleStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusSimple } from "@fortawesome/free-solid-svg-icons";
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { useEffect, useState, useCallback, useRef } from "react";
import LocationButton from "./LocationButton";
import { createPortal } from "react-dom";
import BusStops from "./BusStops";

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

  useEffect(() => {
    // Only zoom once per route selection and only if a specific route is selected (not "all")
    if (!hasZoomed && selectedRoute !== "all") {
      // Find active buses for the selected route
      const activeBuses = vehicles.filter(
        (vehicle) => vehicle.routeId === selectedRoute && vehicle.isActive
      );

      // If there are active buses, zoom to the first one
      if (activeBuses.length > 0) {
        const firstBus = activeBuses[0];
        const lat = parseFloat(firstBus.latitude);
        const lng = parseFloat(firstBus.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          map.flyTo([lat, lng], 15, {
            animate: true,
            duration: 1.5,
          });

          // Mark that we've zoomed for this route selection
          setHasZoomed(true);
        }
      }
    }
  }, [selectedRoute, vehicles, map, hasZoomed]);

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

  const filteredVehicles =
    selectedRoute === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);

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
