"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BusIcon, SearchIcon, CheckIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import GtfsUpdateButton from "@/components/GtfsUpdateButton";
import TrackButton from "@/components/TrackButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useVehicleStore } from "@/store/vehicleStore";
import { parseStopTimes } from "@/lib/gtfs/routeUtil";
import RouteStopsInfo from "@/components/map/RouteStopsInfo";

type RouteOption = {
  value: string;
  label: string;
  busType?: string;
  originalRouteId?: string;
};

interface SidebarInnerProps {
  isMobile?: boolean;
}

// Add StopData type to avoid 'any'
type StopData = {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence?: number;
  isClonedAsFirst?: boolean;
  isDuplicate?: boolean;
};

export function SidebarInner({ isMobile = false }: SidebarInnerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [klRoutesMap, setKlRoutesMap] = useState<Map<string, string>>(
    new Map()
  );

  const selectedRoute =
    useVehicleStore((state) => state.selectedRoute) || "all";
  const selectedBusType = useVehicleStore((state) => state.selectedBusType);
  const setSelectedRoute = useVehicleStore((state) => state.setSelectedRoute);
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );
  const setSelectedBusType = useVehicleStore(
    (state) => state.setSelectedBusType
  );

  // States for route stops display
  const [stopsData, setStopsData] = useState<StopData[]>([]);
  const [tripToStopsMap, setTripToStopsMap] = useState<
    globalThis.Map<string, Array<{ stopId: string; sequence: number }>>
  >(new globalThis.Map());
  const [loadingStops, setLoadingStops] = useState(false);
  const [isStopTimesLoaded, setIsStopTimesLoaded] = useState(false);
  const [relevantStopIds, setRelevantStopIds] = useState<Set<string>>(
    new Set()
  );

  // Determine the bus type to use for API calls
  const busTypeParam = selectedBusType || "mrtfeeder";

  useEffect(() => {
    loadVehiclesFromDatabase();
  }, [loadVehiclesFromDatabase]);

  useEffect(() => {
    fetch("/api/routes?busType=kl")
      .then((response) => response.text())
      .then((data) => {
        const routesMap = new Map<string, string>();
        const lines = data.split("\n");
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const parts = line.split(",");
            if (parts.length >= 3) {
              const routeId = parts[0].trim();
              const routeShortName = parts[2].trim();
              if (routeId && routeShortName) {
                routesMap.set(routeId, routeShortName);
              }
            }
          }
        }
        setKlRoutesMap(routesMap);
      })
      .catch((error) => console.error("Error loading KL routes:", error));
  }, []);

  const routeOptions: RouteOption[] = [
    { value: "all", label: "All Buses" },
    ...Array.from(new Set(vehicles.map((v) => v.routeId)))
      .filter(Boolean)
      .sort()
      .map((route) => {
        const routeVehicle = vehicles.find((v) => v.routeId === route);
        const busType = routeVehicle?.busType || "unknown";

        let label = route;
        if (busType === "kl" && klRoutesMap.has(route)) {
          label = klRoutesMap.get(route) || route;
        }

        return {
          value: route,
          label: label,
          busType: busType,
          originalRouteId: route,
        };
      }),
  ];

  const filteredRoutes = routeOptions.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleRouteSelect = (route: string) => {
    setSelectedRoute(route);
    // Clear the search query when a route is selected
    setSearchQuery("");
    if (route === "all") {
      setSelectedBusType(undefined);
    } else {
      const routeOption = routeOptions.find((r) => r.value === route);
      if (routeOption?.busType) {
        setSelectedBusType(routeOption.busType as "mrtfeeder" | "kl");
      }
    }
  };

  // Load stops data for the mobile view when route changes
  useEffect(() => {
    if (!isMobile || selectedRoute === "all") return;

    setLoadingStops(true);
    console.log(`Fetching stops data for bus type: ${busTypeParam}...`);

    fetch(`/api/stops?busType=${busTypeParam}`)
      .then((res) => res.text())
      .then((data) => {
        const stopLines = data
          .split("\n")
          .filter((line) => line.trim().length > 0);

        // Skip the header line without storing it
        const parsedStops = stopLines.slice(1).map((line) => {
          const values = line.split(",");
          return {
            stop_id: values[0],
            stop_code: values[1] || "N/A",
            stop_name: values[2] || "Unknown",
            stop_lat: parseFloat(values[3]),
            stop_lon: parseFloat(values[4]),
          };
        });

        setStopsData(parsedStops);
        setLoadingStops(false);
      })
      .catch((error) => {
        console.error(`Error fetching stops data for ${busTypeParam}:`, error);
        setLoadingStops(false);
      });
  }, [selectedRoute, busTypeParam, isMobile]);

  // Reset the stop times loaded flag when bus type changes
  useEffect(() => {
    setIsStopTimesLoaded(false);
  }, [busTypeParam]);

  // Fetch stop_times.txt data based on selected bus type
  useEffect(() => {
    if (!isMobile || selectedRoute === "all" || isStopTimesLoaded) return;

    console.log(`Fetching stop_times data for bus type: ${busTypeParam}...`);

    fetch(`/api/stop_times?busType=${busTypeParam}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log(
          `Received ${data.length} bytes of stop_times data for ${busTypeParam}`
        );
        const parsedData = parseStopTimes(data);
        setTripToStopsMap(parsedData);
        setIsStopTimesLoaded(true);
      })
      .catch((error) => {
        console.error(
          `Error loading stop_times data for ${busTypeParam}:`,
          error
        );
      });
  }, [isStopTimesLoaded, busTypeParam, isMobile, selectedRoute]);

  // Find relevant stops based on selected route
  useEffect(() => {
    if (!isMobile || selectedRoute === "all" || !isStopTimesLoaded) return;

    // Find relevant trip IDs for this route
    const routeVehicles = vehicles.filter((v) => v.routeId === selectedRoute);

    if (routeVehicles.length > 0) {
      // Get all stop IDs for these trip IDs
      const stopIdsForRoute = new Set<string>();

      for (const vehicle of routeVehicles) {
        const tripId = vehicle.tripId;
        if (tripToStopsMap.has(tripId)) {
          const stopSequences = tripToStopsMap.get(tripId)!;
          for (const item of stopSequences) {
            stopIdsForRoute.add(item.stopId);
          }
        }
      }

      setRelevantStopIds(stopIdsForRoute);
    } else {
      setRelevantStopIds(new Set());
    }
  }, [selectedRoute, tripToStopsMap, vehicles, isStopTimesLoaded, isMobile]);

  // Filter stops for the selected route and include sequence information
  const filteredStopsWithSequence = useMemo(() => {
    if (!isMobile || selectedRoute === "all") return [];

    // First, get all stops that are relevant to this route
    const relevantStops = stopsData.filter((stop) =>
      relevantStopIds.has(stop.stop_id)
    );

    // Create a map of stopId to sequence number
    const stopSequenceMap = new Map();

    // Find all trips for this route and their stop sequences
    const routeVehicles = vehicles.filter((v) => v.routeId === selectedRoute);

    // We'll get the first trip to determine order (assuming all trips follow similar order)
    if (routeVehicles.length > 0) {
      const firstVehicle = routeVehicles[0];
      const tripId = firstVehicle.tripId;

      if (tripToStopsMap.has(tripId)) {
        const stopSequences = tripToStopsMap.get(tripId)!;

        // Store the sequence for each stop
        stopSequences.forEach((item) => {
          stopSequenceMap.set(item.stopId, item.sequence);
        });
      }
    }

    // Annotate each stop with its sequence
    const stopsWithSequence = relevantStops.map((stop) => ({
      ...stop,
      sequence: stopSequenceMap.get(stop.stop_id) || 999999, // Default high value for unknown sequence
    }));

    // Sort by sequence number
    return stopsWithSequence.sort((a, b) => a.sequence - b.sequence);
  }, [
    stopsData,
    selectedRoute,
    relevantStopIds,
    tripToStopsMap,
    vehicles,
    isMobile,
  ]);

  // Check if first and last stops are the same
  const isCircularRoute = useMemo(() => {
    if (filteredStopsWithSequence.length < 2) return false;
    const firstStop = filteredStopsWithSequence[0];
    const lastStop =
      filteredStopsWithSequence[filteredStopsWithSequence.length - 1];
    return firstStop.stop_id === lastStop.stop_id;
  }, [filteredStopsWithSequence]);

  // Prepare the display data by cloning the last stop and adding it as the first stop
  // but only for MRT feeder buses, not for KL buses
  const displayStops = useMemo(() => {
    if (filteredStopsWithSequence.length === 0) {
      return [];
    }

    // Only clone the last stop for MRT feeder buses
    if (filteredStopsWithSequence.length > 1 && busTypeParam === "mrtfeeder") {
      const lastStop =
        filteredStopsWithSequence[filteredStopsWithSequence.length - 1];
      const clonedLastStop = {
        ...lastStop,
        isClonedAsFirst: true,
        isDuplicate: true,
      };

      return [clonedLastStop, ...filteredStopsWithSequence];
    }

    return filteredStopsWithSequence;
  }, [filteredStopsWithSequence, busTypeParam]);
  return (
    <div className={cn("flex flex-col", isMobile ? "h-full" : "")}>
      {/* Header - only show on mobile */}
      {isMobile && (
        <div className="flex items-center gap-2 px-2 pt-3 pb-4">
          <BusIcon className="h-6 w-6" />
          <h2 className="font-semibold text-lg">Bus Tracker</h2>
        </div>
      )}
      <div className={`${isMobile ? '' : 'flex-1'} overflow-y-auto`}>
        <SidebarGroup>
          <SidebarGroupLabel>Route Selection</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Search Bar */}
            <div className="px-3 mb-3">
              <div className="bg-background/10 rounded-lg border border-border/50 overflow-hidden">
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
                                selectedRoute !== route.value && "ml-6"
                              )}
                              title={
                                route.originalRouteId === route.label
                                  ? ""
                                  : `Route ID: ${route.originalRouteId}`
                              }
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
                    <span className="font-medium">
                      {routeOptions.find((r) => r.value === selectedRoute)
                        ?.label || selectedRoute}
                    </span>
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
            )}{" "}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-auto w-3/4" />{" "}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="w-full flex flex-col gap-4">
              <TrackButton />
              <GtfsUpdateButton />
            </div>            {/* Show stops information in bottom sheet for mobile view */}
            {isMobile && selectedRoute !== "all" && (
              <div className="mt-6 px-3">
                <h3 className="text-sm font-medium mb-2">
                  Route {selectedRoute} - Stops Information
                </h3>
                <RouteStopsInfo
                  filteredStopsWithSequence={filteredStopsWithSequence}
                  isCircularRoute={isCircularRoute}
                  busTypeParam={busTypeParam}
                  displayStops={displayStops}
                  loadingStops={loadingStops}
                  className="pt-2 mobile"
                />
              </div>
            )}
            
            {/* Footer - only show on mobile below stops info */}
            {isMobile && (
              <div className="flex items-center justify-between px-3 py-4 mt-4 border-t">
                <span className="text-xs text-muted-foreground">v1.0.0</span>
                <ThemeToggle />
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </div>
  );
}
