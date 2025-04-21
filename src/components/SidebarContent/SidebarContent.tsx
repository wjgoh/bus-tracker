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
import { useState } from "react";
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
import { useVehicleStore } from "@/store/vehicleStore";

export function BusTrackerSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openRoutes, setOpenRoutes] = useState(false);
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Access the vehicle store
  const selectedRoute =
    useVehicleStore((state) => state.selectedRoute) || "all";
  const setSelectedRoute = useVehicleStore((state) => state.setSelectedRoute);

  // Get unique route options and format them for the ComboBox
  const routeOptions = [
    { value: "all", label: "All Mrt Feeder Bus" },
    ...Array.from(new Set(vehicles.map((v) => v.routeId)))
      .filter(Boolean)
      .sort()
      .map((route) => ({ value: route, label: route })),
  ];

  // Filter routes based on search query
  const filteredRoutes = routeOptions.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced handler for route selection
  const handleRouteSelect = (route: string) => {
    console.log(`Selected route: ${route}`); // Debug logging
    setSelectedRoute(route);
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
                  {selectedRoute === "all"
                    ? "All Mrt Feeder Bus"
                    : routeOptions.find(
                        (route) => route.value === selectedRoute
                      )?.label || "Select route..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {openRoutes && (
                  <div className="absolute z-50 w-full mt-1 bg-popover rounded-md shadow-md">
                    <Command className="rounded-lg border">
                      <CommandInput
                        placeholder="Find route..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList className="max-h-60 overflow-auto">
                        <CommandEmpty>No routes found.</CommandEmpty>
                        <CommandGroup>
                          {filteredRoutes.map((route) => (
                            <CommandItem
                              key={route.value}
                              value={route.value}
                              onSelect={handleRouteSelect}
                              className="cursor-pointer"
                            >
                              <CheckIcon
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
