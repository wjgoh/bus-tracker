import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache the shapes data to avoid reading the file on every request
let cachedShapesData: string | null = null;

export async function GET() {
  try {
    // Return cached data if available
    if (cachedShapesData) {
      return new NextResponse(cachedShapesData, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        },
      });
    }

    // Get the absolute path to the shapes.txt file
    const shapesFilePath = path.join(
      process.cwd(),
      "src",
      "response",
      "shapes.txt"
    );

    // Read the file content
    const shapesData = fs.readFileSync(shapesFilePath, "utf-8");

    // Cache the data in memory
    cachedShapesData = shapesData;

    // Return the file content with caching headers
    return new NextResponse(shapesData, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error reading shapes.txt file:", error);
    return new NextResponse("Error loading shapes data", { status: 500 });
  }
}
