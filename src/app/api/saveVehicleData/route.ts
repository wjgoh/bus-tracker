import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// This is a server-side API route that can use Node.js modules like fs/promises
export async function POST(request: Request) {
  try {
    // Get the data from the request body
    const data = await request.json();

    // Define the output file path (in the project root)
    const outputPath = path.join(process.cwd(), "vehicle_positions.json");

    // Write the data to a file
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

    // Return a success response
    return NextResponse.json({
      success: true,
      message: `Data saved to ${outputPath}`,
    });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save data",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}