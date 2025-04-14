/**
 * Utility for mapping between different route ID formats
 * (vehicle API route IDs and GTFS route IDs)
 */

// Map from vehicle API route IDs to GTFS route IDs
export const vehicleToGtfsRouteMap: Record<string, string> = {
  // Add mappings here as you discover them
  // Example: "APL": "1",  // Airport Line in API maps to route 1 in GTFS
};

// Map from GTFS route IDs to vehicle API route IDs
export const gtfsToVehicleRouteMap: Record<string, string> = {};

// Initialize the reverse mapping
for (const [vehicleId, gtfsId] of Object.entries(vehicleToGtfsRouteMap)) {
  gtfsToVehicleRouteMap[gtfsId] = vehicleId;
}

/**
 * Convert a vehicle route ID to a GTFS route ID
 */
export function toGtfsRouteId(vehicleRouteId: string): string {
  // First check if we have a direct mapping
  if (vehicleToGtfsRouteMap[vehicleRouteId]) {
    return vehicleToGtfsRouteMap[vehicleRouteId];
  }

  // If no direct mapping, try some common transformations

  // 1. Try adding a leading zero if it's a number (e.g. "1" -> "01")
  if (/^\d+$/.test(vehicleRouteId) && vehicleRouteId.length === 1) {
    return `0${vehicleRouteId}`;
  }

  // 2. Or try removing a leading zero (e.g. "01" -> "1")
  if (vehicleRouteId.startsWith("0") && vehicleRouteId.length > 1) {
    return vehicleRouteId.substring(1);
  }

  // 3. If nothing else works, just return the original ID
  return vehicleRouteId;
}

/**
 * Get all possible GTFS route ID variants for a vehicle route ID
 * This helps when we're not sure of the exact format
 */
export function getAllPossibleRouteIds(routeId: string): string[] {
  const variants = [routeId];

  // Try with and without leading zeros
  if (/^\d+$/.test(routeId)) {
    // If it's just a number, add leading zero
    if (routeId.length === 1) {
      variants.push(`0${routeId}`);
    }
    // If it has leading zeros, add a version without them
    else if (routeId.startsWith("0")) {
      variants.push(routeId.replace(/^0+/, ""));
    }
  }

  // Add any mapped variant
  const mappedId = vehicleToGtfsRouteMap[routeId];
  if (mappedId && !variants.includes(mappedId)) {
    variants.push(mappedId);
  }

  return variants;
}

/**
 * Debug function to check if a route exists in the trips data
 */
export function debugRouteIdsInTrips(
  routeId: string,
  routeToShapes: Map<string, Set<string>>
): void {
  console.log(`Debugging route ID: ${routeId}`);

  // Get all possible variants of the route ID
  const variants = getAllPossibleRouteIds(routeId);
  console.log(`Possible route ID variants: ${variants.join(", ")}`);

  // Check each variant against the trips data
  for (const variant of variants) {
    if (routeToShapes.has(variant)) {
      console.log(`✓ Found match for variant: ${variant}`);
    } else {
      console.log(`✗ No match for variant: ${variant}`);
    }
  }

  // Also log all available route IDs in the trips data for reference
  console.log(
    "All available route IDs in trips data:",
    Array.from(routeToShapes.keys()).sort().join(", ")
  );
}

/**
 * Utility for mapping between different trip ID formats
 */

// Map from vehicle API trip IDs to GTFS trip IDs
export const vehicleToGtfsTripMap: Record<string, string> = {
  // Add mappings here as you discover them
  // Example: "Route123": "trip_123",
};

// Map from GTFS trip IDs to vehicle API trip IDs
export const gtfsToVehicleTripMap: Record<string, string> = {};

// Initialize the reverse mapping
for (const [vehicleId, gtfsId] of Object.entries(vehicleToGtfsTripMap)) {
  gtfsToVehicleTripMap[gtfsId] = vehicleId;
}

/**
 * Get all possible GTFS trip ID variants for a vehicle trip ID
 * This helps when we're not sure of the exact format
 */
export function getAllPossibleTripIds(tripId: string): string[] {
  const variants = [tripId];

  // Add any mapped variant
  const mappedId = vehicleToGtfsTripMap[tripId];
  if (mappedId && !variants.includes(mappedId)) {
    variants.push(mappedId);
  }

  return variants;
}

/**
 * Debug function to check if a trip exists in the trips data
 */
export function debugTripIdsInTrips(
  tripId: string,
  tripToShapes: Map<string, Set<string>>
): void {
  console.log(`Debugging trip ID: ${tripId}`);

  // Get all possible variants of the trip ID
  const variants = getAllPossibleTripIds(tripId);
  console.log(`Possible trip ID variants: ${variants.join(", ")}`);

  // Check each variant against the trips data
  for (const variant of variants) {
    if (tripToShapes.has(variant)) {
      console.log(`✓ Found match for variant: ${variant}`);
    } else {
      console.log(`✗ No match for variant: ${variant}`);
    }
  }

  // Also log a sample of available trip IDs in the trips data for reference
  const allTripIds = Array.from(tripToShapes.keys()).sort();
  console.log(
    "Sample of available trip IDs in trips data:",
    allTripIds.slice(0, 10).join(", ") +
      (allTripIds.length > 10 ? ` ... and ${allTripIds.length - 10} more` : "")
  );
}
