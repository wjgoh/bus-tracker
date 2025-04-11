import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { NextResponse } from "next/server";

// Configuration
const URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-mrtfeeder";

export async function GET() {
  try {
    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(
        `${response.url}: ${response.status} ${response.statusText}`
      );
    }

    // Get the response body as an ArrayBuffer
    const buffer = await response.arrayBuffer();

    // Decode the ArrayBuffer into a GTFS Realtime FeedMessage object
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    // Extract and simplify vehicle position information
    const vehiclePositions = feed.entity
      .filter((entity) => entity.vehicle)
      .map((entity) => ({
        tripId: entity.vehicle.trip?.tripId || "N/A",
        routeId: entity.vehicle.trip?.routeId || "N/A",
        vehicleId: entity.vehicle.vehicle?.id || "N/A",
        latitude: entity.vehicle.position?.latitude?.toFixed(5) || "N/A",
        longitude: entity.vehicle.position?.longitude?.toFixed(5) || "N/A",
        timestamp: entity.vehicle.timestamp
          ? new Date(Number(entity.vehicle.timestamp) * 1000).toISOString()
          : "N/A",
        congestion: entity.vehicle.congestionLevel || "N/A",
        stopId: entity.vehicle.stopId || "N/A",
        status: entity.vehicle.currentStatus || "N/A",
      }));

    return NextResponse.json({ success: true, data: vehiclePositions });
  } catch (error) {
    console.error("Error fetching GTFS data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch GTFS data",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
