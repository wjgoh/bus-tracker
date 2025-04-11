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
  selectedRoute: string;
}

export default function Map({
  center = [3.139, 101.6869], // Kuala Lumpur coordinates
  zoom = 12,
  selectedRoute = "all",
}: MapProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);

  const filteredVehicles =
    selectedRoute === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);

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
    <div className="flex-1 h-full">
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
  );
}
