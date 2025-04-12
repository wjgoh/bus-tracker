import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const vehiclePositions = await request.json();

    // Begin a transaction
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      for (const vehicle of vehiclePositions) {
        const {
          tripId,
          routeId,
          vehicleId,
          latitude,
          longitude,
          timestamp,
          congestion,
          stopId,
          status,
          isActive,
          lastSeen,
        } = vehicle;

        // Using parameterized query for security
        await client.query(
          `INSERT INTO vehicle_positions 
           (trip_id, route_id, vehicle_id, latitude, longitude, timestamp, congestion, stop_id, status, is_active, last_seen)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (vehicle_id) DO UPDATE SET
           trip_id = $1, route_id = $2, latitude = $4, longitude = $5, 
           timestamp = $6, congestion = $7, stop_id = $8, status = $9, is_active = $10, last_seen = $11`,
          [
            tripId,
            routeId,
            vehicleId,
            latitude,
            longitude,
            timestamp,
            congestion,
            stopId,
            status,
            isActive,
            lastSeen,
          ]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving vehicle data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save vehicle data",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
