/**
 * Utility functions for handling bus stops data
 */

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

/**
 * Parse stops.txt content into an array of Stop objects
 */
export function parseStops(stopsData: string): Stop[] {
  const stopLines = stopsData
    .split("\n")
    .filter((line) => line.trim().length > 0);

  // Skip header line
  const parsedStops = stopLines.slice(1).map((line) => {
    const values = line.split(",");
    return {
      stop_id: values[0],
      stop_code: values[1],
      stop_name: values[2],
      stop_lat: parseFloat(values[3]),
      stop_lon: parseFloat(values[4]),
    };
  });

  return parsedStops;
}

/**
 * Filter stops by route ID (placeholder for future implementation)
 * In a real application, this would use a mapping between routes and stops
 */
export function getStopsByRoute(stops: Stop[], _routeId: string): Stop[] {
  // Prefix routeId with an underscore
  // For now, return all stops since we don't have route-to-stop mapping
  // In a real implementation, this would filter stops based on the route
  return stops;
}
