import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BusType } from "@/lib/db";

/**
 * API route to serve the stop_times.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    // Get the absolute path to the stop_times.txt file based on bus type
    let stopTimesFilePath = path.join(
      process.cwd(),
      "src",
      `rapid_bus_${busType}`,
      "stop_times.txt"
    );

    // Check if file exists, fallback to mrtfeeder if kl file doesn't exist
    if (!fs.existsSync(stopTimesFilePath) && busType === "kl") {
      console.log(
        `File not found: ${stopTimesFilePath}, falling back to mrtfeeder stop_times data`
      );
      stopTimesFilePath = path.join(
        process.cwd(),
        "src",
        "rapid_bus_mrtfeeder",
        "stop_times.txt"
      );
    }

    // Check if even the fallback file exists
    if (!fs.existsSync(stopTimesFilePath)) {
      console.error(`File not found: ${stopTimesFilePath}`);
      return new NextResponse("Stop times data file not found", {
        status: 404,
      });
    }

    // Read the file content
    const stopTimesData = fs.readFileSync(stopTimesFilePath, "utf-8");

    // Return the file content as text
    return new NextResponse(stopTimesData, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error reading stop_times.txt file:", error);
    return new NextResponse("Error loading stop times data", { status: 500 });
  }
}
