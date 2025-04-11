import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useVehicleStore } from "@/store/vehicleStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusSimple } from "@fortawesome/free-solid-svg-icons";
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

export default function Map({ center = [51.505, -0.09], zoom = 13 }: MapProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [selectedRoute, setSelectedRoute] = useState<string>("all");

  const filteredVehicles =
    selectedRoute === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);

  const routeOptions = [...new Set(vehicles.map((v) => v.routeId))];

  const getBusIcon = () => {
    const iconHtml = renderToString(
      <FontAwesomeIcon
        icon={faBusSimple}
        style={{ color: "#0066cc", fontSize: "24px" }}
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", backgroundColor: "white" }}>
        <div
          style={{
            fontSize: "14px",
            color: "#666",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div>Buses Located: {filteredVehicles.length}</div>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            style={{
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All Routes</option>
            {routeOptions.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredVehicles.map((vehicle) => (
            <Marker
              key={vehicle.vehicleId}
              position={[
                parseFloat(vehicle.latitude),
                parseFloat(vehicle.longitude),
              ]}
              icon={getBusIcon()}
            >
              <Popup>
                <div>
                  <p>Route: {vehicle.routeId}</p>
                  <p>Vehicle ID: {vehicle.vehicleId}</p>
                  <p>Status: {vehicle.status}</p>
                  <p>
                    Last Updated: {new Date(vehicle.timestamp).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
