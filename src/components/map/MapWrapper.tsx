"use client";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect, useMemo, useCallback } from "react";
import { useVehicleStore } from "@/store/vehicleStore";
import { useStopStore } from "@/store/stopStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStopTimes } from "@/lib/gtfs/routeUtil";

// Define proper types for stops data
interface StopData {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence?: number;
  isClonedAsFirst?: boolean;
  isDuplicate?: boolean;
}

export default function MapWrapper() {
  const selectedRoute = useVehicleStore(
    (state) => state.selectedRoute || "all"
  );
  const selectedBusType = useVehicleStore((state) => state.selectedBusType);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [stopsData, setStopsData] = useState<StopData[]>([]);
  // Use a different name than 'Map' for the Map constructor
  const [tripToStopsMap, setTripToStopsMap] = useState<
    globalThis.Map<string, Array<{ stopId: string; sequence: number }>>
  >(new globalThis.Map());
  const [loadingStops, setLoadingStops] = useState(false);
  const [isStopTimesLoaded, setIsStopTimesLoaded] = useState(false);
  const [relevantStopIds, setRelevantStopIds] = useState<Set<string>>(
    new Set()
  );
  const activeStopId = useStopStore((state) => state.activeStopId);
  const setActiveStopId = useStopStore((state) => state.setActiveStopId);

  // Function to scroll to active stop in the stops list, wrapped in useCallback
  const scrollToActiveStop = useCallback(() => {
    if (activeStopId) {
      // Wait for render to complete
      setTimeout(() => {
        const activeStopElement = document.getElementById(
          `stop-${activeStopId}`
        );
        if (activeStopElement) {
          activeStopElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [activeStopId]);

  // Effect to scroll to active stop when it changes
  useEffect(() => {
    scrollToActiveStop();
  }, [scrollToActiveStop]);

  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // Determine the bus type to use for API calls
  const busTypeParam = selectedBusType || "mrtfeeder";

  // Effect to fetch stops data when component mounts or when bus type changes
  useEffect(() => {
    setLoadingStops(true);
    console.log(`Fetching stops data for bus type: ${busTypeParam}...`);

    fetch(`/api/stops?busType=${busTypeParam}`)
      .then((res) => res.text())
      .then((data) => {
        const stopLines = data
          .split("\n")
          .filter((line) => line.trim().length > 0);

        console.log(
          `Loaded ${stopLines.length - 1} stops for ${busTypeParam} buses`
        );

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
  }, [busTypeParam]); // Refetch when bus type changes

  // Reset the stop times loaded flag when bus type changes
  useEffect(() => {
    setIsStopTimesLoaded(false);
  }, [busTypeParam]);

  // Fetch stop_times.txt data based on selected bus type
  useEffect(() => {
    if (isStopTimesLoaded) return;

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
  }, [isStopTimesLoaded, busTypeParam]);

  // Find relevant stops based on selected route
  useEffect(() => {
    if (selectedRoute === "all" || !isStopTimesLoaded) return;

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
  }, [selectedRoute, tripToStopsMap, vehicles, isStopTimesLoaded]);

  // Set up refresh for vehicle data only
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchVehicleData() {
      try {
        await loadVehiclesFromDatabase();
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      }
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase, selectedBusType]);

  // Memoize the dynamic Map component to prevent unnecessary re-creation
  const MapComponent = useMemo(
    () =>
      dynamic(() => import("./Map"), {
        ssr: false,
        loading: () => <p>Loading map...</p>,
      }),
    []
  );

  // Filter stops for the selected route and include sequence information
  const filteredStopsWithSequence = useMemo(() => {
    if (selectedRoute === "all") return [];

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
  }, [stopsData, selectedRoute, relevantStopIds, tripToStopsMap, vehicles]);

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
    <div className="relative w-full h-full">
      <div className="w-full h-full relative z-0">
        <Suspense fallback={<div>Loading...</div>}>
          <MapComponent selectedRoute={selectedRoute} />
        </Suspense>
      </div>

      {/* Bus stops information card */}
      {selectedRoute !== "all" && (
        <div className="absolute top-4 right-4 z-10 w-72 max-h-[70vh] overflow-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Route {selectedRoute} - Stops Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loadingStops ? (
                <p className="text-sm">Loading stops...</p>
              ) : displayStops.length === 0 ? (
                <p className="text-sm">No stops found for this route.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    Showing all {filteredStopsWithSequence.length} stops in
                    sequence
                    {isCircularRoute && (
                      <span className="ml-1 text-xs italic">
                        (Circular route)
                      </span>
                    )}
                  </p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {displayStops.map((stop, index) => {
                      // For MRT feeder buses, the first stop is at index 1 (due to cloned last stop at index 0)
                      // For Rapid Bus KL, the first stop is at index 0
                      const isOriginalFirst =
                        busTypeParam === "mrtfeeder"
                          ? index === 1
                          : index === 0;
                      const isOriginalLast = index === displayStops.length - 1;
                      const isClonedLastStop = stop.isClonedAsFirst;

                      // For Rapid Bus KL, use the full stop_name which includes the code and location
                      // For MRT Feeder, the stop_name is already formatted correctly
                      let displayName = stop.stop_name;

                      // For KL buses, extract just the actual name part (remove the road name)
                      if (busTypeParam === "kl") {
                        // First case: Names with comma separator (e.g., "KL1320 ENDAH VILLA CONDOMINIUM,JLN 2/149B")
                        if (stop.stop_name.includes(",")) {
                          const parts = stop.stop_name.split(",");
                          if (parts.length > 1) {
                            const codePart = parts[0].trim();
                            // Extract the actual name by removing the code prefix (like "KL1320 ")
                            const codeMatch =
                              codePart.match(/^[A-Z]+\d+\s+(.+)$/);
                            if (codeMatch && codeMatch[1]) {
                              displayName = codeMatch[1].trim();
                            } else {
                              // Fallback if the regex doesn't match
                              displayName = codePart;
                            }
                          }
                        }
                        // Special case: If stop_name is "Unknown" but we have a stop_code, use it
                        else if (
                          stop.stop_name === "Unknown" &&
                          stop.stop_code &&
                          stop.stop_code !== "N/A"
                        ) {
                          displayName = `${stop.stop_code}`;
                        }
                        // Second case: Names that are just street names (e.g., "JLN TUN ABDUL RAZAK")
                        else if (
                          stop.stop_name.startsWith("JLN ") ||
                          stop.stop_name.startsWith("PERS ") ||
                          stop.stop_name.startsWith("LEBUH ") ||
                          stop.stop_name.startsWith("L/RAYA ")
                        ) {
                          // Try to find a nearby landmark or use the stop code
                          if (stop.stop_code && stop.stop_code !== "N/A") {
                            displayName = `${stop.stop_code}`;
                          } else {
                            // Just use a generic name with the stop ID as reference
                            displayName = `Bus Stop ${index + 1}`;
                          }
                        }
                        // Third case: Names with code prefix but no comma (e.g., "BD550 SRI TANJUNG 1")
                        else {
                          const codeMatch =
                            stop.stop_name.match(/^[A-Z]+\d+\s+(.+)$/);
                          if (codeMatch && codeMatch[1]) {
                            displayName = codeMatch[1].trim();
                          }
                        }
                      }

                      return (
                        <div
                          key={`${stop.stop_id}-${index}`} // Add index to key to avoid duplicate key issues
                          id={`stop-${stop.stop_id}`}
                          className={`text-xs p-2 rounded flex items-start cursor-pointer transition-all duration-200 ${
                            activeStopId === stop.stop_id
                              ? "bg-primary/20 border border-primary shadow-md"
                              : "bg-muted/50 hover:bg-muted/80"
                          }`}
                          onClick={() => {
                            // Update the active stop ID using the global store
                            setActiveStopId(stop.stop_id);

                            // Find the map reference point to center on this stop
                            const mapElement =
                              document.querySelector(".leaflet-container");
                            if (mapElement) {
                              // Create a custom event to notify the BusStops component to focus on this stop
                              const event = new CustomEvent("focus-stop", {
                                detail: {
                                  stopId: stop.stop_id,
                                  lat: stop.stop_lat,
                                  lon: stop.stop_lon,
                                },
                              });
                              mapElement.dispatchEvent(event);
                            }
                          }}
                        >
                          <div className="mr-2 mt-0.5 flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {/* For MRT feeder buses, keep the index as is (with 0st stop) */}
                              {/* For Rapid Bus KL, start numbering from 1 instead of 0 */}
                              {busTypeParam === "mrtfeeder" ? index : index + 1}
                            </span>
                          </div>
                          <div>
                            <div
                              className={`font-medium ${
                                activeStopId === stop.stop_id
                                  ? "text-primary font-bold"
                                  : ""
                              }`}
                            >
                              {displayName}
                              {isClonedLastStop && (
                                <span className="ml-1 text-blue-500 font-bold">
                                  • Mrt Stop
                                </span>
                              )}
                              {isOriginalFirst && (
                                <span
                                  className={`ml-1 ${
                                    isCircularRoute
                                      ? "text-purple-500"
                                      : "text-green-500"
                                  } font-bold`}
                                >
                                  {isCircularRoute
                                    ? "• Terminal Start"
                                    : "• First Stop"}
                                </span>
                              )}
                              {isOriginalLast && !isCircularRoute && (
                                <span className="ml-1 text-red-500 font-bold">
                                  • Last Stop
                                </span>
                              )}
                              {isOriginalLast && isCircularRoute && (
                                <span className="ml-1 text-purple-500 font-bold">
                                  • Terminal End
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-muted-foreground ${
                                activeStopId === stop.stop_id
                                  ? "text-primary-foreground/80"
                                  : ""
                              }`}
                            >
                              Stop Code: {stop.stop_code} <br />
                              ID: {stop.stop_id}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* For circular routes, add a note about the route returning to the first stop */}
                  {isCircularRoute && (
                    <div className="text-xs italic text-muted-foreground pt-2">
                      Route returns to{" "}
                      {filteredStopsWithSequence[0]?.stop_name ||
                        "starting point"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
