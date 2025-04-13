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

      // Prepare batch values for all vehicles
      const values = [];
      const valueStrings = [];
      let valueIndex = 1;

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

        const formattedTimestamp = new Date(timestamp).toISOString();
        const formattedLastSeen = new Date(lastSeen).toISOString();

        values.push(
          tripId,
          routeId,
          vehicleId,
          parseFloat(latitude) || 0,
          parseFloat(longitude) || 0,
          formattedTimestamp,
          congestion,
          stopId,
          status,
          Boolean(isActive),
          formattedLastSeen
        );

        const placeholders = Array.from(
          { length: 11 },
          (_, i) => `$${valueIndex + i}`
        ).join(", ");
        valueStrings.push(`(${placeholders})`);
        valueIndex += 11;
      }

      // Execute batch upsert
      if (values.length > 0) {
        const query = `
          INSERT INTO vehicle_positions 
          (trip_id, route_id, vehicle_id, latitude, longitude, timestamp, 
           congestion, stop_id, status, is_active, last_seen)
          VALUES ${valueStrings.join(", ")}
          ON CONFLICT (vehicle_id) DO UPDATE SET
            trip_id = EXCLUDED.trip_id,
            route_id = EXCLUDED.route_id,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            timestamp = EXCLUDED.timestamp,
            congestion = EXCLUDED.congestion,
            stop_id = EXCLUDED.stop_id,
            status = EXCLUDED.status,
            is_active = EXCLUDED.is_active,
            last_seen = EXCLUDED.last_seen,
            updated_at = NOW()
        `;
        await client.query(query, values);
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
