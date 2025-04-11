import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useVehicleStore } from "@/store/vehicleStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusSimple } from "@fortawesome/free-solid-svg-icons";
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

export default function Map({ center = [51.505, -0.09], zoom = 13 }: MapProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filteredVehicles =
    selectedRoute === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);

  // Get unique route options and format them for the ComboBox
  const routeOptions = [
    { value: "all", label: "All Routes" },
    ...Array.from(new Set(vehicles.map((v) => v.routeId)))
      .filter(Boolean)
      .sort()
      .map((route) => ({ value: route, label: route })),
  ];

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

  // Outer wrapper with controls fixed at the top
  return (
    <div className="flex h-full flex-col">
      {/* Control panel above the map */}
      <div className="bg-background p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Buses Located: {filteredVehicles.length}
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {selectedRoute === "all"
                  ? "All Routes"
                  : selectedRoute || "Select route..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search route..." />
                <CommandList>
                  <CommandEmpty>No route found.</CommandEmpty>
                  <CommandGroup>
                    {routeOptions.map((route) => (
                      <CommandItem
                        key={route.value}
                        value={route.value}
                        onSelect={(currentValue) => {
                          setSelectedRoute(currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRoute === route.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {route.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1">
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
