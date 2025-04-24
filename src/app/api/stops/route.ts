import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BusType } from "@/lib/db";

/**
 * API route to serve the stops.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    // Get the absolute path to the stops.txt file based on bus type
    let stopsFilePath = path.join(
      process.cwd(),
      "src",
      `rapid_bus_${busType}`,
      "stops.txt"
    );

    // Check if file exists, fallback to mrtfeeder if kl file doesn't exist
    if (!fs.existsSync(stopsFilePath) && busType === "kl") {
      console.log(
        `File not found: ${stopsFilePath}, falling back to mrtfeeder stops data`
      );
      stopsFilePath = path.join(
        process.cwd(),
        "src",
        "rapid_bus_mrtfeeder",
        "stops.txt"
      );
    }

    // Check if even the fallback file exists
    if (!fs.existsSync(stopsFilePath)) {
      console.error(`File not found: ${stopsFilePath}`);
      return new NextResponse("Stops data file not found", { status: 404 });
    }

    // Read the file content
    const stopsData = fs.readFileSync(stopsFilePath, "utf-8");

    // Return the file content as text
    return new NextResponse(stopsData, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error reading stops.txt file:", error);
    return new NextResponse("Error loading stops data", { status: 500 });
  }
}
