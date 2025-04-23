"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  MapIcon,
  BusIcon,
  InfoIcon,
  SettingsIcon,
  SearchIcon,
  CheckIcon,
  ChevronsUpDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import GtfsUpdateButton from "@/components/GtfsUpdateButton";
import TrackButton from "@/components/TrackButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVehicleStore } from "@/store/vehicleStore";

// Define the type for route options
type RouteOption = {
  value: string;
  label: string;
  busType?: string;
};

export function BusTrackerSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openRoutes, setOpenRoutes] = useState(false);
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Access the vehicle store
  const selectedRoute =
    useVehicleStore((state) => state.selectedRoute) || "all";
  const setSelectedRoute = useVehicleStore((state) => state.setSelectedRoute);
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );
  const setSelectedBusType = useVehicleStore(
    (state) => state.setSelectedBusType
  );

  // Effect to load all vehicles on initial render
  useEffect(() => {
    loadVehiclesFromDatabase();
  }, [loadVehiclesFromDatabase]);

  // Get unique route options and format them for the ComboBox
  const routeOptions: RouteOption[] = [
    {
      value: "all",
      label: "All Buses",
    },
    ...Array.from(new Set(vehicles.map((v) => v.routeId)))
      .filter(Boolean)
      .sort()
      .map((route) => {
        // Find a representative vehicle for this route to get its bus type
        const routeVehicle = vehicles.find((v) => v.routeId === route);
        return {
          value: route,
          label: route,
          busType: routeVehicle?.busType || "unknown",
        };
      }),
  ];

  // Filter routes based on search query
  const filteredRoutes = routeOptions.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced handler for route selection
  const handleRouteSelect = (route: string) => {
    console.log(`Selected route: ${route}`); // Debug logging
    setSelectedRoute(route);

    // Set the corresponding bus type for the selected route
    if (route === "all") {
      // When "All Buses" is selected, don't set a specific bus type
      setSelectedBusType(undefined);
    } else {
      // Find the bus type for the selected route
      const routeOption = routeOptions.find((r) => r.value === route);
      if (routeOption?.busType) {
        setSelectedBusType(routeOption.busType as "mrtfeeder" | "kl");
        console.log(`Set bus type to: ${routeOption.busType}`);
      }
    }

    setOpenRoutes(false);
  };

  return (
    <>
      <Sidebar>
        <SidebarTrigger className="absolute -right-12 top-4 bg-background border shadow-sm rounded-md" />

        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 pt-3">
            <BusIcon className="h-6 w-6" />
            <h2 className="font-semibold text-lg">Bus Tracker</h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Route Selection</SidebarGroupLabel>
            <SidebarGroupContent>
              {/* Search Bar */}
              <div className="px-3 mb-3">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search routes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 py-2 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Route Selector */}
              <div className="px-3 mb-3 relative">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRoutes}
                  className="w-full justify-between text-sm h-9"
                  onClick={() => setOpenRoutes(!openRoutes)}
                >
                  <div className="flex items-center gap-2 overflow-hidden max-w-full">
                    {selectedRoute === "all" ? (
                      "All Buses"
                    ) : (
                      <>
                        <span className="truncate max-w-[7rem]">
                          {routeOptions.find(
                            (route) => route.value === selectedRoute
                          )?.label || "Select route..."}
                        </span>
                        {selectedRoute !== "all" && (
                          <Badge
                            variant={
                              routeOptions.find(
                                (route) => route.value === selectedRoute
                              )?.busType === "mrtfeeder"
                                ? "success"
                                : "info"
                            }
                          >
                            {routeOptions.find(
                              (route) => route.value === selectedRoute
                            )?.busType === "mrtfeeder"
                              ? "MRT Feeder"
                              : "Rapid Bus KL"}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {openRoutes && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-popover rounded-md shadow-md">
                    <Command className="rounded-lg border w-full overflow-hidden">
                      <CommandInput
                        placeholder="Find route..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="w-full"
                      />
                      <CommandList className="max-h-48 overflow-auto">
                        <CommandEmpty>No routes found.</CommandEmpty>
                        <CommandGroup className="overflow-hidden">
                          {filteredRoutes.map((route) => (
                            <CommandItem
                              key={route.value}
                              value={route.value}
                              onSelect={handleRouteSelect}
                              className="cursor-pointer flex items-center w-full overflow-hidden"
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  selectedRoute === route.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex justify-between items-center w-full overflow-hidden">
                                <span className="truncate text-sm">
                                  {route.label}
                                </span>
                                {route.value !== "all" && (
                                  <Badge
                                    className="ml-1 px-1 text-xs whitespace-nowrap"
                                    variant={
                                      route.busType === "mrtfeeder"
                                        ? "success"
                                        : "info"
                                    }
                                  >
                                    {route.busType === "mrtfeeder"
                                      ? "MRT Feeder"
                                      : "Rapid Bus KL"}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              {/* Current Selection */}
              {selectedRoute !== "all" && (
                <div className="px-3 mb-3">
                  <p className="text-sm text-muted-foreground">
                    Currently showing:
                    <span className="font-semibold ml-1 text-foreground">
                      {routeOptions.find((r) => r.value === selectedRoute)
                        ?.label || selectedRoute}
                    </span>
                  </p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={true} tooltip="Map">
                    <MapIcon />
                    <span>Map View</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Bus Routes">
                    <BusIcon />
                    <span>Bus Routes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-auto w-3/4" />

          <SidebarGroup>
            <SidebarGroupLabel>Information</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="About">
                    <InfoIcon />
                    <span>About</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <div className="w-full flex flex-col gap-4 mt-4">
                <TrackButton />
                <GtfsUpdateButton />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">v1.0.0</span>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
