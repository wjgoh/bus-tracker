import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API route to serve the stop_times.txt file content
 */
export async function GET() {
  try {
    // Get the absolute path to the stop_times.txt file
    const stopTimesFilePath = path.join(
      process.cwd(),
      "src",
      "rapid_bus_mrtfeeder",
      "stop_times.txt"
    );

    // Check if the file exists
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
