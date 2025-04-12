import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// This API route will set up the database table for vehicle positions
export async function GET() {
  try {
    const client = await db.connect();

    try {
      // Create the vehicle_positions table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_positions (
          id SERIAL PRIMARY KEY,
          vehicle_id TEXT UNIQUE NOT NULL,
          trip_id TEXT NOT NULL,
          route_id TEXT NOT NULL,
          latitude TEXT NOT NULL,
          longitude TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          congestion TEXT,
          stop_id TEXT,
          status TEXT,
          is_active BOOLEAN DEFAULT true,
          last_seen TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create an index on vehicle_id for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_id 
        ON vehicle_positions(vehicle_id)
      `);

      return NextResponse.json({
        success: true,
        message: "Database setup completed successfully",
      });
    } catch (error) {
      console.error("Error setting up database:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to set up database",
          error: (error as Error).message,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to database",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
