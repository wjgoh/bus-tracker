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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
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
    <>
      {/* Actual sidebar - Move trigger inside sidebar */}
      <Sidebar>
        {/* Sidebar trigger button now inside the sidebar component */}
        <SidebarTrigger className="absolute -right-12 top-4 bg-background border shadow-sm rounded-md" />

        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 pt-3">
            <BusIcon className="h-6 w-6" />
            <h2 className="font-semibold text-lg">Bus Tracker</h2>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Search Bar with Combobox */}
          <div className="px-3 mb-4 space-y-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 py-2 h-9 text-sm"
              />
            </div>

            <Popover open={openRoutes} onOpenChange={setOpenRoutes}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRoutes}
                  className="w-full justify-between text-sm h-9"
                >
                  {selectedRoute
                    ? routeOptions.find(
                        (route) => route.value === selectedRoute
                      )?.label || selectedRoute
                    : "Find a route..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search routes..."
                    className="h-9"
                  />
                  <CommandEmpty>No routes found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {routeOptions.map((route) => (
                        <CommandItem
                          key={route.value}
                          value={route.value}
                          onSelect={(currentValue) => {
                            setSelectedRoute(
                              currentValue === selectedRoute
                                ? null
                                : currentValue
                            );
                            setOpenRoutes(false);
                          }}
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
              </PopoverContent>
            </Popover>
          </div>

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
            <SidebarGroup></SidebarGroup>
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
