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
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import GtfsUpdateButton from "@/components/GtfsUpdateButton";
import TrackButton from "@/components/TrackButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
              {/* Search Bar for Routes - Redesigned */}
              <div className="px-3 mb-3">
                <div className="bg-background/10 rounded-lg border border-border/50 overflow-hidden">
                  {/* Search Input */}
                  <div className="flex items-center px-3 py-2 border-b border-border/30">
                    <SearchIcon className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                      type="text"
                      placeholder="Search routes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-7 p-0 placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Route List - Only show when there's search text */}
                  {searchQuery.trim() !== "" && (
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredRoutes.length === 0 ? (
                        <div className="text-center py-2 text-sm text-muted-foreground">
                          No routes found
                        </div>
                      ) : (
                        filteredRoutes.map((route) => (
                          <div
                            key={route.value}
                            onClick={() => handleRouteSelect(route.value)}
                            className={cn(
                              "flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-accent/50",
                              selectedRoute === route.value && "bg-accent/30"
                            )}
                          >
                            <div className="flex items-center">
                              {selectedRoute === route.value && (
                                <CheckIcon className="h-4 w-4 mr-2 text-primary" />
                              )}
                              <span
                                className={cn(
                                  "font-medium text-sm",
                                  selectedRoute !== route.value && "ml-6" // Keep alignment consistent
                                )}
                              >
                                {route.label}
                              </span>
                            </div>

                            {route.value !== "all" && (
                              <Badge
                                className="ml-2 px-2 py-0.5 text-xs"
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
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Currently Selected Route */}
              {selectedRoute !== "all" && (
                <div className="px-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Currently showing:
                      </span>
                      <span className="font-medium">{selectedRoute}</span>
                    </div>
                    <Badge
                      variant={
                        routeOptions.find((r) => r.value === selectedRoute)
                          ?.busType === "mrtfeeder"
                          ? "success"
                          : "info"
                      }
                      className="px-2 py-0.5"
                    >
                      {routeOptions.find((r) => r.value === selectedRoute)
                        ?.busType === "mrtfeeder"
                        ? "MRT Feeder"
                        : "Rapid Bus KL"}
                    </Badge>
                  </div>
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
