"use client";

import { useState, useEffect } from "react";
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
import { useVehicleStore } from "@/store/vehicleStore";

interface RouteSelectorProps {
  selectedRoute: string;
  onRouteChange: (route: string) => void;
}

export default function RouteSelector({
  selectedRoute,
  onRouteChange,
}: RouteSelectorProps) {
  const [open, setOpen] = useState(false);
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Get unique route options and format them for the ComboBox
  const routeOptions = [
    { value: "all", label: "All Routes" },
    ...Array.from(new Set(vehicles.map((v) => v.routeId)))
      .filter(Boolean)
      .sort()
      .map((route) => ({ value: route, label: route })),
  ];

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="text-sm text-muted-foreground">
        Buses Located:{" "}
        {selectedRoute === "all"
          ? vehicles.length
          : vehicles.filter((v) => v.routeId === selectedRoute).length}
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
                      onRouteChange(currentValue);
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
  );
}
