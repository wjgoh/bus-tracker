import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BusType } from "@/lib/db";

/**
 * API route to serve the trips.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    // Get the absolute path to the trips.txt file based on bus type
    let tripsFilePath = path.join(
      process.cwd(),
      "src",
      `rapid_bus_${busType}`,
      "trips.txt"
    );

    // Check if file exists, fallback to mrtfeeder if kl file doesn't exist
    if (!fs.existsSync(tripsFilePath) && busType === "kl") {
      console.log(
        `File not found: ${tripsFilePath}, falling back to mrtfeeder trips data`
      );
      tripsFilePath = path.join(
        process.cwd(),
        "src",
        "rapid_bus_mrtfeeder",
        "trips.txt"
      );
    }

    // Check if even the fallback file exists
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
