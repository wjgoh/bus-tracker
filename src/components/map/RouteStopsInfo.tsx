import { useEffect } from "react";
import { useStopStore } from "@/store/stopStore";

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

interface RouteStopsInfoProps {
  filteredStopsWithSequence: StopData[];
  isCircularRoute: boolean;
  busTypeParam: string;
  displayStops: StopData[];
  className?: string;
  loadingStops?: boolean;
}

export default function RouteStopsInfo({
  filteredStopsWithSequence,
  isCircularRoute,
  busTypeParam,
  displayStops,
  className = "",
  loadingStops = false,
}: RouteStopsInfoProps) {
  const activeStopId = useStopStore((state) => state.activeStopId);
  const setActiveStopId = useStopStore((state) => state.setActiveStopId);

  // Scroll to active stop when it changes
  useEffect(() => {
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

  if (loadingStops) {
    return <p className="text-sm">Loading stops...</p>;
  }

  if (displayStops.length === 0) {
    return <p className="text-sm">No stops found for this route.</p>;
  }
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-medium">
        Showing all {filteredStopsWithSequence.length} stops in sequence
        {isCircularRoute && (
          <span className="ml-1 text-xs italic">(Circular route)</span>
        )}
      </p>
      <div className={`space-y-1 ${className?.includes('mobile') ? '' : 'max-h-60 overflow-y-auto'}`}>
        {displayStops.map((stop, index) => {
          // For MRT feeder buses, the first stop is at index 1 (due to cloned last stop at index 0)
          // For Rapid Bus KL, the first stop is at index 0
          const isOriginalFirst =
            busTypeParam === "mrtfeeder" ? index === 1 : index === 0;
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
                const codeMatch = codePart.match(/^[A-Z]+\d+\s+(.+)$/);
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
              const codeMatch = stop.stop_name.match(/^[A-Z]+\d+\s+(.+)$/);
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
                  ? "bg-primary/70 dark:bg-primary/30 border border-primary shadow-md" // Higher opacity for light mode
                  : "bg-muted/50 hover:bg-muted/80"
              }`}
              onClick={() => {
                // Update the active stop ID using the global store
                setActiveStopId(stop.stop_id);

                // Find the map reference point to center on this stop
                const mapElement = document.querySelector(".leaflet-container");
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
                    activeStopId === stop.stop_id ? "text-white font-bold" : ""
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
                        isCircularRoute ? "text-purple-500" : "text-green-500"
                      } font-bold`}
                    >
                      {isCircularRoute ? "• Terminal Start" : "• First Stop"}
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
                </div>{" "}
                <div
                  className={`text-muted-foreground ${
                    activeStopId === stop.stop_id
                      ? "text-gray-300 font-normal"
                      : ""
                  }`}
                >
                  <span
                    className={
                      activeStopId === stop.stop_id ? "text-gray-300" : ""
                    }
                  >
                    Stop Code: {stop.stop_code} <br />
                    ID: {stop.stop_id}
                  </span>
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
          {filteredStopsWithSequence[0]?.stop_name || "starting point"}
        </div>
      )}
    </div>
  );
}
