import { NextResponse } from "next/server";
import { getAllVehicleData } from "@/lib/db";

export async function GET() {
  try {
    const result = await getAllVehicleData();

    if (!result.success) {
      throw new Error(
        result.error || "Failed to fetch vehicle data from database"
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vehicle data",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
