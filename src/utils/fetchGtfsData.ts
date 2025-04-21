import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

export async function fetchAndUnzipGtfsData() {
  try {
    console.log("Fetching GTFS data from API...");

    // Create response directory if it doesn't exist
    const responsePath = path.join(process.cwd(), "src", "rapid_bus_mrtfeeder");
    try {
      await fs.access(responsePath);
    } catch {
      // If directory doesn't exist, create it
      await fs.mkdir(responsePath, { recursive: true });
    }

    // Fetch the ZIP file from the API
    const response = await axios({
      method: "GET",
      url: "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-mrtfeeder",
      responseType: "arraybuffer",
    });

    // Load the ZIP file content
    const zip = await JSZip.loadAsync(response.data);

    console.log("Extracting GTFS files...");

    // Extract each file from the ZIP
    const extractionPromises = Object.keys(zip.files).map(async (filename) => {
      if (!zip.files[filename].dir) {
        const content = await zip.files[filename].async("nodebuffer");
        const filePath = path.join(responsePath, filename);
        await fs.writeFile(filePath, content);
        console.log(`Extracted: ${filename}`);
      }
    });

    await Promise.all(extractionPromises);
    console.log("GTFS data updated successfully");

    return true;
  } catch (error) {
    console.error("Error fetching or extracting GTFS data:", error);
    return false;
  }
}
