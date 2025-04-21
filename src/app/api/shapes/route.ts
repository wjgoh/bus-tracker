import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API route to serve the shapes.txt file content
 */
export async function GET() {
  try {
    // Get the absolute path to the shapes.txt file
    const shapesFilePath = path.join(
      process.cwd(),
      "src",
      "rapid_bus_mrtfeeder",
      "shapes.txt"
    );

    // Read the file content
    const shapesData = fs.readFileSync(shapesFilePath, "utf-8");

    // Return the file content as text
    return new NextResponse(shapesData, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error reading shapes.txt file:", error);
    return new NextResponse("Error loading shapes data", { status: 500 });
  }
}
