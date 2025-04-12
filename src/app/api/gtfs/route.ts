import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { NextResponse } from "next/server";

// Configuration - rename this to avoid conflict with global URL constructor
const API_URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-mrtfeeder";

export async function GET(request: Request) {
  try {
    const response = await fetch(API_URL); // Use the renamed constant here

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
      .filter(
        (
          entity
        ): entity is GtfsRealtimeBindings.transit_realtime.IFeedEntity & {
          vehicle: NonNullable<
            GtfsRealtimeBindings.transit_realtime.IFeedEntity["vehicle"]
          >;
        } => entity.vehicle !== null && entity.vehicle !== undefined
      )
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
        isActive: true,
        lastSeen: new Date().toISOString(),
      }));

    // Save the vehicle data to the database and update inactive vehicles
    try {
      // Get the base URL from the request
      const baseUrl = new URL(request.url).origin;

      // Get all active vehicle IDs from the current API response
      const activeVehicleIds = vehiclePositions.map(
        (vehicle) => vehicle.vehicleId
      );

      // Use the fetch API to call our saveVehicleData endpoint
      const saveUrl = `${baseUrl}/api/saveVehicleData`;

      const saveResponse = await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicles: vehiclePositions,
          activeVehicleIds: activeVehicleIds,
        }),
      });

      if (!saveResponse.ok) {
        console.warn(
          "Failed to save vehicle data to database:",
          await saveResponse.text()
        );
      }
    } catch (saveError) {
      console.error("Error saving to database:", saveError);
      // Continue with the response even if saving fails
    }

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
