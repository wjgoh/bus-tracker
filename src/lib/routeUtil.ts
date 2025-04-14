/**
 * Utility functions for handling route shape data
 */

import { getAllPossibleTripIds, debugTripIdsInTrips } from "./routeMapping";

export interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

export interface RouteShape {
  route_id: string;
  shape_id: string;
  points: [number, number][]; // Array of [lat, lng] coordinates
  direction?: "forward" | "backward"; // Travel direction (based on stop sequence)
}

/**
 * Parse shapes.txt content into shape point objects
 */
export function parseShapes(shapesData: string): ShapePoint[] {
  if (!shapesData) return [];

  try {
    const lines = shapesData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Debug the header and first data line to understand structure
    if (lines.length > 0) {
      console.log("Shapes file header:", lines[0]);
      if (lines.length > 1) {
        console.log("First shape data line:", lines[1]);
      }
    }

    // Skip header
    const shapePoints = lines
      .slice(1)
      .map((line, idx) => {
        const values = line.split(",");

        // Add validation to prevent NaN values
        const lat = parseFloat(values[1]);
        const lon = parseFloat(values[2]);
        const sequence = parseInt(values[3], 10);

        if (isNaN(lat) || isNaN(lon) || isNaN(sequence)) {
          console.warn(`Invalid shape point data at line ${idx + 2}:`, values);
          return null;
        }

        return {
          shape_id: values[0],
          shape_pt_lat: lat,
          shape_pt_lon: lon,
          shape_pt_sequence: sequence,
        };
      })
      .filter(Boolean) as ShapePoint[];

    console.log(
      `Parsed ${shapePoints.length} shape points from ${lines.length - 1} lines`
    );

    // Debug: Check some data points
    if (shapePoints.length > 0) {
      console.log("Sample shape point:", shapePoints[0]);

      // Check how many unique shape_ids we have
      const uniqueShapeIds = new Set(shapePoints.map((p) => p.shape_id));
      console.log(`Found ${uniqueShapeIds.size} unique shape_ids`);
    }

    return shapePoints;
  } catch (error) {
    console.error("Error parsing shapes data:", error);
    return [];
  }
}

/**
 * Parse trips.txt to get the relationship between trips and shapes
 */
export function parseTrips(tripsData: string): Map<string, Set<string>> {
  if (!tripsData) return new Map();

  try {
    const routeToShapes = new Map<string, Set<string>>();
    const lines = tripsData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Debug the header to understand the column structure
    if (lines.length > 0) {
      console.log("Trips file header:", lines[0]);
      if (lines.length > 1) {
        console.log("First trip data line:", lines[1]);
      }
    }

    // Determine shape_id column index from header
    const headers = lines[0].toLowerCase().split(",");
    const shapeIdIndex = headers.findIndex((h) => h.trim() === "shape_id");
    const tripIdIndex = headers.findIndex((h) => h.trim() === "trip_id");
    const routeIdIndex = headers.findIndex((h) => h.trim() === "route_id");

    console.log(
      `Found shape_id at column ${shapeIdIndex}, trip_id at column ${tripIdIndex}, route_id at column ${routeIdIndex}`
    );

    if (shapeIdIndex === -1 || tripIdIndex === -1) {
      console.error("Could not find shape_id or trip_id columns in trips file");
      return new Map();
    }

    // Create a mapping from trip_id to route_id if route_id is available
    const tripToRoute = new Map<string, string>();

    if (routeIdIndex !== -1) {
      // If route_id exists in the data, store the mapping for reference
      lines.slice(1).forEach((line) => {
        const values = line.split(",");
        if (values.length > Math.max(routeIdIndex, tripIdIndex)) {
          const route_id = values[routeIdIndex].trim();
          const trip_id = values[tripIdIndex].trim();
          if (route_id && trip_id) {
            tripToRoute.set(trip_id, route_id);
          }
        }
      });
      console.log(`Created mapping for ${tripToRoute.size} trips to routes`);
    }

    // Skip header and process trip to shape relationships
    lines.slice(1).forEach((line, idx) => {
      const values = line.split(",");

      if (values.length <= Math.max(tripIdIndex, shapeIdIndex)) {
        console.warn(`Line ${idx + 2} doesn't have enough columns:`, line);
        return;
      }

      const trip_id = values[tripIdIndex].trim();
      const shape_id = values[shapeIdIndex].trim();

      // Use trip_id as the key instead of route_id
      if (trip_id && shape_id) {
        if (!routeToShapes.has(trip_id)) {
          routeToShapes.set(trip_id, new Set());
        }
        routeToShapes.get(trip_id)!.add(shape_id);
      }
    });

    // Debug to check if we're finding trip-shape relations
    console.log(`Found trip-shape mappings for ${routeToShapes.size} trips`);

    // Sample some trips for debugging
    let count = 0;
    routeToShapes.forEach((shapes, trip) => {
      if (count < 5) {
        // Only log first 5 for brevity
        console.log(`Trip ${trip} has ${shapes.size} shapes`);
        count++;
      }
    });

    return routeToShapes;
  } catch (error) {
    console.error("Error parsing trips data:", error);
    return new Map();
  }
}

/**
 * Parse stop_times.txt to get the relationship between trips and stops with sequence information
 */
export function parseStopTimes(stopTimesData: string): Map<string, Array<{ stopId: string, sequence: number }>> {
  if (!stopTimesData) return new Map();

  try {
    const tripToStopSequences = new Map<string, Array<{ stopId: string, sequence: number }>>();
    const lines = stopTimesData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Debug the header to understand the column structure
    if (lines.length > 0) {
      console.log("Stop times file header:", lines[0]);
      if (lines.length > 1) {
        console.log("First stop time data line:", lines[1]);
      }
    }

    // Determine column indices from header
    const headers = lines[0].toLowerCase().split(",");
    const tripIdIndex = headers.findIndex((h) => h.trim() === "trip_id");
    const stopIdIndex = headers.findIndex((h) => h.trim() === "stop_id");
    const stopSequenceIndex = headers.findIndex((h) => h.trim() === "stop_sequence");

    console.log(
      `Found trip_id at column ${tripIdIndex}, stop_id at column ${stopIdIndex}, stop_sequence at column ${stopSequenceIndex}`
    );

    if (stopIdIndex === -1 || tripIdIndex === -1) {
      console.error("Could not find stop_id or trip_id columns in stop_times file");
      return new Map();
    }

    // Skip header and process trip to stop relationships with sequence
    lines.slice(1).forEach((line, idx) => {
      const values = line.split(",");

      if (values.length <= Math.max(tripIdIndex, stopIdIndex, stopSequenceIndex)) {
        console.warn(`Line ${idx + 2} doesn't have enough columns:`, line);
        return;
      }

      const trip_id = values[tripIdIndex].trim();
      const stop_id = values[stopIdIndex].trim();
      const sequence = stopSequenceIndex !== -1 ? parseInt(values[stopSequenceIndex].trim(), 10) : idx;

      if (trip_id && stop_id) {
        if (!tripToStopSequences.has(trip_id)) {
          tripToStopSequences.set(trip_id, []);
        }
        tripToStopSequences.get(trip_id)!.push({ 
          stopId: stop_id, 
          sequence: isNaN(sequence) ? idx : sequence 
        });
      }
    });

    // Sort each trip's stops by sequence number
    tripToStopSequences.forEach((stops) => {
      stops.sort((a, b) => a.sequence - b.sequence);
    });

    console.log(`Found trip-stop mappings for ${tripToStopSequences.size} trips`);
    return tripToStopSequences;
  } catch (error) {
    console.error("Error parsing stop_times data:", error);
    return new Map();
  }
}

/**
 * Determine the direction of a shape by comparing first and last stops in the sequence
 */
export function determineRouteDirection(
  shapePoints: ShapePoint[], 
  tripStopSequence: Array<{ stopId: string, sequence: number }>
): "forward" | "backward" | undefined {
  if (tripStopSequence.length < 2) {
    return undefined;
  }
  
  // For now just return "forward" as a default
  // In a real implementation, you would compare the geographic direction
  // of the shape points to the stop sequence to determine direction
  return "forward";
}

/**
 * Build route shapes for a specific trip ID
 */
export function buildRouteShapes(
  shapePoints: ShapePoint[],
  tripToShapes: Map<string, Set<string>>,
  selectedTripId: string,
  tripStopSequence?: Array<{ stopId: string, sequence: number }>
): RouteShape[] {
  console.log(`Building route shapes for trip ${selectedTripId}`);

  if (!selectedTripId || selectedTripId === "all") return [];

  // Debug to help identify any trip ID mismatches
  debugTripIdsInTrips(selectedTripId, tripToShapes);

  // Try all possible variants of the trip ID
  let shapeIds: Set<string> | undefined;
  const tripVariants = getAllPossibleTripIds(selectedTripId);

  for (const tripVariant of tripVariants) {
    shapeIds = tripToShapes.get(tripVariant);
    if (shapeIds) {
      console.log(`Found shapes using trip variant: ${tripVariant}`);
      break;
    }
  }

  // If no shapes were found for any variant
  if (!shapeIds) {
    console.warn(`No shapes found for any variant of trip ${selectedTripId}`);
    return [];
  }

  console.log(
    `Found ${shapeIds.size} shape IDs for trip ${selectedTripId}:`,
    Array.from(shapeIds)
  );

  // Group shape points by shape_id
  const shapeGroups = new Map<string, ShapePoint[]>();
  shapePoints.forEach((point) => {
    if (shapeIds!.has(point.shape_id)) {
      if (!shapeGroups.has(point.shape_id)) {
        shapeGroups.set(point.shape_id, []);
      }
      shapeGroups.get(point.shape_id)!.push(point);
    }
  });

  console.log(`Created ${shapeGroups.size} shape groups`);

  // Build route shapes for each shape_id
  const routeShapes: RouteShape[] = [];
  shapeGroups.forEach((points, shapeId) => {
    // Sort points by sequence
    points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

    console.log(`Shape ${shapeId} has ${points.length} points`);

    // Extract coordinates - careful with lat/lon order for Leaflet
    const coordinates = points.map((p) => {
      // Leaflet expects [lat, lng] while many systems store as [lng, lat]
      const lat = p.shape_pt_lat;
      const lng = p.shape_pt_lon;
      return [lat, lng] as [number, number];
    });

    if (coordinates.length > 0) {
      // Check if coordinates look good
      console.log(
        `First coordinate: [${coordinates[0][0]}, ${coordinates[0][1]}]`
      );
      if (coordinates.length > 1) {
        console.log(
          `Last coordinate: [${coordinates[coordinates.length - 1][0]}, ${
            coordinates[coordinates.length - 1][1]
          }]`
        );
      }

      // Determine the direction of the route
      const direction = tripStopSequence ? determineRouteDirection(points, tripStopSequence) : undefined;

      routeShapes.push({
        route_id: selectedTripId, // We're using trip_id as the identifier
        shape_id: shapeId,
        points: coordinates,
        direction, // Add the direction
      });
      console.log(
        `Created shape for ${shapeId} with ${coordinates.length} points and direction: ${direction || 'unknown'}`
      );
    } else {
      console.warn(`No valid coordinates for shape ${shapeId}`);
    }
  });

  console.log(`Built ${routeShapes.length} route shapes`);
  return routeShapes;
}
