// src/app/api/getVehicleData/route.ts
import { NextResponse } from "next/server";
import { getAllVehicleData } from "@/lib/db";

export async function GET(_request: Request) {
  try {
    // Get all vehicle data from the database
    const result = await getAllVehicleData();

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to retrieve vehicle data",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in getVehicleData API:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
