import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

/**
 * Function to be called when the page loads to fetch and unzip GTFS data
 */
export async function loadGtfsData() {
  console.log("Page loaded, fetching GTFS data...");
  return fetchAndUnzipGtfsData();
}

export async function fetchAndUnzipGtfsData() {
  try {
    console.log("Fetching GTFS data from APIs...");

    // Define the GTFS data sources
    const sources = [
      {
        category: "rapid-bus-mrtfeeder",
        dirName: "rapid_bus_mrtfeeder",
      },
      {
        category: "rapid-bus-kl",
        dirName: "rapid_bus_kl",
      },
    ];

    // Process each source
    for (const source of sources) {
      console.log(`Processing ${source.category} data...`);

      // Create response directory if it doesn't exist
      const responsePath = path.join(process.cwd(), "src", source.dirName);
      try {
        await fs.access(responsePath);
      } catch {
        // If directory doesn't exist, create it
        await fs.mkdir(responsePath, { recursive: true });
      }

      // Fetch the ZIP file from the API
      console.log(`Downloading ${source.category} from API...`);
      const response = await axios({
        method: "GET",
        url: `https://api.data.gov.my/gtfs-static/prasarana?category=${source.category}`,
        responseType: "arraybuffer",
      });

      // Load the ZIP file content
      const zip = await JSZip.loadAsync(response.data);

      console.log(`Extracting ${source.category} GTFS files...`);

      // Extract each file from the ZIP
      const extractionPromises = Object.keys(zip.files).map(
        async (filename) => {
          if (!zip.files[filename].dir) {
            const content = await zip.files[filename].async("nodebuffer");
            const filePath = path.join(responsePath, filename);
            await fs.writeFile(filePath, content);
            console.log(`Extracted: ${filename} to ${source.dirName}`);
          }
        }
      );

      await Promise.all(extractionPromises);
      console.log(`${source.category} GTFS data updated successfully`);
    }

    return true;
  } catch (error) {
    console.error("Error fetching or extracting GTFS data:", error);
    return false;
  }
}
