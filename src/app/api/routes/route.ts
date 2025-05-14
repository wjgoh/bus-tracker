import { NextResponse } from "next/server";
import { fetchGtfsFile } from "@/lib/api/gtfsService";
import { BusType } from "@/lib/db";

/**
 * API route to serve the routes.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    try {
      // Use the centralized service to fetch the file
      const routesData = await fetchGtfsFile("routes.txt", busType);

      // Return the file content as text
      return new NextResponse(routesData, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } catch {
      console.log(
        `Error fetching routes for ${busType}, falling back to mrtfeeder`
      );

      if (busType === "kl") {
        // Only try fallback if the original request was for KL
        try {
          const fallbackData = await fetchGtfsFile("routes.txt", "mrtfeeder");
          return new NextResponse(fallbackData, {
            headers: {
              "Content-Type": "text/plain",
            },
          });
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          return new NextResponse("Routes data file not found", { status: 404 });
        }
      } else {
        return new NextResponse("Routes data file not found", { status: 404 });
      }
    }
  } catch (error) {
    console.error("Error reading routes.txt file:", error);
    return new NextResponse("Error loading routes data", { status: 500 });
  }
}