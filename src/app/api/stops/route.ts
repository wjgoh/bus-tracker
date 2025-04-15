import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API route to serve the stops.txt file content
 */
export async function GET() {
  try {
    // Get the absolute path to the stops.txt file
    const stopsFilePath = path.join(
      process.cwd(),
      "public",
      "gtfs",
      "stops.txt"
    );

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
