// src/lib/db.ts (partial update)
import { createPool } from "@vercel/postgres";

// Create a connection pool to Vercel Postgres with connection string
export const db = createPool({
  connectionString: process.env.POSTGRES_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection from the pool
});

// Define the vehicle data structure
export type VehicleData = {
  vehicleId: string;
  tripId: string;
  routeId: string;
  latitude: string;
  longitude: string;
  timestamp: string;
  congestion: string;
  stopId: string;
  status: string;
  isActive: boolean;
  lastSeen: string;
};

// Function to save vehicle data to the database
export async function saveVehicleData(
  vehicles: VehicleData[],
  activeVehicleIds?: string[]
) {
  try {
    // Begin a transaction
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // For each vehicle, insert or update its data
      for (const vehicle of vehicles) {
        const query = `
          INSERT INTO rapid_bus_mrtfeeder (
            vehicle_id, trip_id, route_id, latitude, longitude, 
            timestamp, congestion, stop_id, status, is_active, last_seen
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (vehicle_id) 
          DO UPDATE SET 
            trip_id = $2,
            route_id = $3,
            latitude = $4,
            longitude = $5,
            timestamp = $6,
            congestion = $7,
            stop_id = $8,
            status = $9,
            is_active = $10,
            last_seen = $11
        `;

        const values = [
          vehicle.vehicleId,
          vehicle.tripId,
          vehicle.routeId,
          vehicle.latitude,
          vehicle.longitude,
          vehicle.timestamp,
          vehicle.congestion,
          vehicle.stopId,
          vehicle.status,
          vehicle.isActive,
          vehicle.lastSeen,
        ];

        await client.query(query, values);
      }

      // If activeVehicleIds is provided, mark vehicles not in the list as inactive
      if (activeVehicleIds && activeVehicleIds.length > 0) {
        // Update all vehicles not in the activeVehicleIds list to inactive
        const placeholders = activeVehicleIds
          .map((_, i) => `$${i + 1}`)
          .join(",");
        await client.query(
          `
          UPDATE rapid_bus_mrtfeeder
          SET is_active = false, updated_at = NOW()
          WHERE vehicle_id NOT IN (${placeholders})
          AND is_active = true
          `,
          activeVehicleIds
        );
      }

      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Function to get all vehicle data from the database
export async function getAllVehicleData() {
  try {
    const result = await db.query<VehicleData>(`
      SELECT 
        vehicle_id as "vehicleId", 
        trip_id as "tripId", 
        route_id as "routeId", 
        latitude, 
        longitude, 
        timestamp, 
        congestion, 
        stop_id as "stopId", 
        status, 
        is_active as "isActive", 
        last_seen as "lastSeen"
      FROM rapid_bus_mrtfeeder
    `);

    return { success: true, data: result.rows };
  } catch (error) {
    console.error("Database error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Function to get active vehicle IDs
export async function getActiveVehicleIds() {
  try {
    const result = await db.query<{ vehicleId: string }>(`
      SELECT vehicle_id as "vehicleId"
      FROM rapid_bus_mrtfeeder
      WHERE is_active = true
    `);

    return { success: true, data: result.rows.map((row) => row.vehicleId) };
  } catch (error) {
    console.error("Database error:", error);
    return { success: false, error: (error as Error).message };
  }
}
