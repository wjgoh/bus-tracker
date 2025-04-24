// src/app/api/getVehicleData/route.ts
import { NextResponse } from "next/server";
import { getAllVehicleData, BusType } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    // Get all vehicle data from the database
    const result = await getAllVehicleData(busType);

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
