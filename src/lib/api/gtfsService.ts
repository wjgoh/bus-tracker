/**
 * GTFS Data Service
 * Provides methods to fetch and handle GTFS data from APIs or local storage
 */

import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

// Centralize configuration for easier maintenance
const GTFS_SOURCES = [
  {
    category: "rapid-bus-mrtfeeder",
    dirName: "rapid_bus_mrtfeeder",
  },
  {
    category: "rapid-bus-kl",
    dirName: "rapid_bus_kl",
  },
];

const API_BASE_URL = "https://api.data.gov.my/gtfs-static/prasarana";
const TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * Function to be called when the page loads to fetch and unzip GTFS data
 */
export async function loadGtfsData() {
  console.log("Page loaded, fetching GTFS data...");
  return fetchAndUnzipGtfsData();
}

/**
 * Ensures a directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Fetches GTFS data from APIs and unzips to appropriate directories
 */
export async function fetchAndUnzipGtfsData() {
  try {
    console.log("Fetching GTFS data from APIs...");

    // Process each source
    for (const source of GTFS_SOURCES) {
      console.log(`Processing ${source.category} data...`);

      // Create response directory if it doesn't exist
      const responsePath = path.join(process.cwd(), "src", source.dirName);
      await ensureDirectoryExists(responsePath);

      // Fetch the ZIP file from the API
      console.log(`Downloading ${source.category} from API...`);
      const response = await axios({
        method: "GET",
        url: `${API_BASE_URL}?category=${source.category}`,
        responseType: "arraybuffer",
        timeout: TIMEOUT_MS,
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

/**
 * Fetches specific GTFS file data for a bus type
 * @param fileName - Name of the GTFS file to fetch (e.g., 'stops.txt', 'routes.txt')
 * @param busType - Type of bus ('mrtfeeder' or 'kl')
 */
export async function fetchGtfsFile(
  fileName: string,
  busType: string = "mrtfeeder"
): Promise<string> {
  try {
    // Determine directory based on bus type
    const dirName = busType === "kl" ? "rapid_bus_kl" : "rapid_bus_mrtfeeder";
    const filePath = path.join(process.cwd(), "src", dirName, fileName);

    // Read the file
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    console.error(`Error fetching ${fileName} for ${busType}:`, error);
    throw new Error(`Failed to fetch ${fileName} data for ${busType}`);
  }
}

/**
 * Fetches vehicle data from the backend API
 */
export async function fetchVehicleData() {
  try {
    const response = await axios.get("/api/getVehicleData");
    return response.data;
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    throw error;
  }
}
