import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BusType } from "@/lib/db";

/**
 * API route to serve the shapes.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    // Get the absolute path to the shapes.txt file based on bus type
    let shapesFilePath = path.join(
      process.cwd(),
      "src",
      `rapid_bus_${busType}`,
      "shapes.txt"
    );

    // Check if file exists, fallback to mrtfeeder if kl file doesn't exist
    if (!fs.existsSync(shapesFilePath) && busType === "kl") {
      console.log(
        `File not found: ${shapesFilePath}, falling back to mrtfeeder shapes data`
      );
      shapesFilePath = path.join(
        process.cwd(),
        "src",
        "rapid_bus_mrtfeeder",
        "shapes.txt"
      );
    }

    // Check if even the fallback file exists
    if (!fs.existsSync(shapesFilePath)) {
      console.error(`File not found: ${shapesFilePath}`);
      return new NextResponse("Shapes data file not found", { status: 404 });
    }

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
