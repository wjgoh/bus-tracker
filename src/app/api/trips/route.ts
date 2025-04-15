import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache the trips data to avoid reading the file on every request
let cachedTripsData: string | null = null;

export async function GET() {
  try {
    // Return cached data if available
    if (cachedTripsData) {
      return new NextResponse(cachedTripsData, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      });
    }

    // Get the absolute path to the trips.txt file
    const tripsFilePath = path.join(
      process.cwd(),
      "public",
      "gtfs",
      "trips.txt"
    );

    // Check if file exists
    if (!fs.existsSync(tripsFilePath)) {
      console.error(`File not found: ${tripsFilePath}`);
      return new NextResponse(`Trips file not found at ${tripsFilePath}`, {
        status: 404,
      });
    }

    // Read the file content
    const tripsData = fs.readFileSync(tripsFilePath, "utf-8");

    // Cache the data in memory
    cachedTripsData = tripsData;

    // Return the file content with caching headers
    return new NextResponse(tripsData, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error reading trips.txt file:", error);
    return new NextResponse(
      `Error loading trips data: ${(error as Error).message}`,
      { status: 500 }
    );
  }
}
