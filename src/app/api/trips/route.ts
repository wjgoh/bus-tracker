import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API route to serve the trips.txt file content
 */
export async function GET() {
  try {
    // Get the absolute path to the trips.txt file
    const tripsFilePath = path.join(
      process.cwd(),
      "src",
      "rapid_bus_mrtfeeder",
      "trips.txt"
    );

    // Check if the file exists
    if (!fs.existsSync(tripsFilePath)) {
      console.error(`File not found: ${tripsFilePath}`);
      return new NextResponse("Trips data file not found", { status: 404 });
    }

    // Read the file content
    const tripsData = fs.readFileSync(tripsFilePath, "utf-8");

    // Return the file content as text
    return new NextResponse(tripsData, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error reading trips.txt file:", error);
    return new NextResponse("Error loading trips data", { status: 500 });
  }
}
