import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const stopsFilePath = path.join(
      process.cwd(),
      "public",
      "gtfs",
      "stops.txt"
    );

    // Check if file exists
    if (!fs.existsSync(stopsFilePath)) {
      console.error(`File not found: ${stopsFilePath}`);
      return new NextResponse("Stops data file not found", { status: 404 });
    }

    const stopsData = fs.readFileSync(stopsFilePath, "utf-8");
    return new NextResponse(stopsData, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error reading stops.txt file:", error);
    return new NextResponse(
      `Error loading stops data: ${(error as Error).message}`,
      { status: 500 }
    );
  }
}
