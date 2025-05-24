import { NextResponse } from "next/server";
import { fetchGtfsFile } from "@/lib/api/gtfsService";
import { BusType } from "@/lib/db";

/**
 * API route to serve the shapes.txt file content
 */
export async function GET(request: Request) {
  try {
    // Get bus type from query parameters
    const url = new URL(request.url);
    const busType = (url.searchParams.get("busType") as BusType) || "mrtfeeder";

    try {
      // Use the centralized service to fetch the file
      const shapesData = await fetchGtfsFile("shapes.txt", busType);

      // Return the file content as text
      return new NextResponse(shapesData, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (fetchError) {
      console.log(
        `Error fetching shapes for ${busType}, falling back to mrtfeeder`
      );

      if (busType === "kl") {
        // Only try fallback if the original request was for KL
        try {
          const fallbackData = await fetchGtfsFile("shapes.txt", "mrtfeeder");
          return new NextResponse(fallbackData, {
            headers: {
              "Content-Type": "text/plain",
            },
          });
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          return new NextResponse("Shapes data file not found", {
            status: 404,
          });
        }
      } else {
        return new NextResponse("Shapes data file not found", { status: 404 });
      }
    }
  } catch (error) {
    console.error("Error reading shapes.txt file:", error);
    return new NextResponse("Error loading shapes data", { status: 500 });
  }
}
