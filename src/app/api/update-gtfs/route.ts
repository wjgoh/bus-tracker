import { fetchAndUnzipGtfsData } from "@/lib/api/gtfsService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await fetchAndUnzipGtfsData();

    if (result) {
      return NextResponse.json({
        success: true,
        message: "GTFS data updated successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to update GTFS data" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error updating GTFS data",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
