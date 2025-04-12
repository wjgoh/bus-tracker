// src/app/api/saveVehicleData/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { vehicles: vehiclePositions, activeVehicleIds } =
      await request.json();

    // Begin a transaction
    const client = await db.connect();

    try {
      // Create the vehicle_positions table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_positions (
          id SERIAL PRIMARY KEY,
          vehicle_id TEXT UNIQUE NOT NULL,
          trip_id TEXT NOT NULL,
          route_id TEXT NOT NULL,
          latitude NUMERIC(10, 7) NOT NULL,
          longitude NUMERIC(10, 7) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          congestion TEXT,
          stop_id TEXT,
          status TEXT,
          is_active BOOLEAN DEFAULT true,
          last_seen TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_id 
        ON vehicle_positions(vehicle_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vehicle_positions_route_id 
        ON vehicle_positions(route_id)
      `);

      await client.query("BEGIN");

      // First, update all vehicles from the current API response
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

        // Convert string timestamps to proper format if needed
        const formattedTimestamp = new Date(timestamp).toISOString();
        const formattedLastSeen = new Date(lastSeen).toISOString();

        // Using parameterized query for security
        await client.query(
          `
          INSERT INTO vehicle_positions 
           (trip_id, route_id, vehicle_id, latitude, longitude, timestamp, congestion, stop_id, status, is_active, last_seen, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
           ON CONFLICT (vehicle_id) DO UPDATE SET
           trip_id = $1, 
           route_id = $2, 
           latitude = $4, 
           longitude = $5, 
           timestamp = $6, 
           congestion = $7, 
           stop_id = $8, 
           status = $9, 
           is_active = $10, 
           last_seen = $11,
           updated_at = NOW()
        `,
          [
            tripId,
            routeId,
            vehicleId,
            parseFloat(latitude) || 0, // Convert to numeric and handle invalid values
            parseFloat(longitude) || 0, // Convert to numeric and handle invalid values
            formattedTimestamp,
            congestion,
            stopId,
            status,
            Boolean(isActive),
            formattedLastSeen,
          ]
        );
      }

      // Then, mark vehicles as inactive if they're not in the current API response
      if (activeVehicleIds && activeVehicleIds.length > 0) {
        // Update all vehicles not in the activeVehicleIds list to inactive
        await client.query(
          `
          UPDATE vehicle_positions
          SET is_active = false, updated_at = NOW()
          WHERE vehicle_id NOT IN (${activeVehicleIds
            .map((_: string, i: number) => `$${i + 1}`)
            .join(",")})
          AND is_active = true
          `,
          activeVehicleIds
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database transaction error:", error);
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
