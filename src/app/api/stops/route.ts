import { NextResponse } from "next/server";
import { fetchGtfsFile } from "@/lib/api/gtfsService";
import { BusType } from "@/lib/db";

/**
 * API route to serve the stops.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    try {
      // Use the centralized service to fetch the file
      const stopsData = await fetchGtfsFile("stops.txt", busType);

      // Return the file content as text
      return new NextResponse(stopsData, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } catch {
      console.log(
        `Error fetching stops for ${busType}, falling back to mrtfeeder`
      );

      if (busType === "kl") {
        // Only try fallback if the original request was for KL
        try {
          const fallbackData = await fetchGtfsFile("stops.txt", "mrtfeeder");
          return new NextResponse(fallbackData, {
            headers: {
              "Content-Type": "text/plain",
            },
          });
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          return new NextResponse("Stops data file not found", { status: 404 });
        }
      } else {
        return new NextResponse("Stops data file not found", { status: 404 });
      }
    }
  } catch (error) {
    console.error("Error reading stops.txt file:", error);
    return new NextResponse("Error loading stops data", { status: 500 });
  }
}
