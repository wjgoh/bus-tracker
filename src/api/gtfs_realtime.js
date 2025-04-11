"use client";

import { useEffect } from "react";
import { useVehicleStore } from "@/store/vehicleStore";

const INTERVAL_SECONDS = 30;
const INTERVAL_MS = INTERVAL_SECONDS * 1000;

export function VehicleDataFetcher() {
  const updateVehicles = useVehicleStore((state) => state.updateVehicles);

  // Function to perform one cycle of fetching and processing data
  async function fetchAndProcessData() {
    const startTime = new Date();
    console.log(`\n[${startTime.toISOString()}] Starting data fetch cycle...`);

    try {
      console.log("Fetching GTFS data from API...");
      const response = await fetch("/api/gtfs");

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "API request failed");
      }

      const vehiclePositions = result.data;

      // Update the Zustand store with new vehicle positions
      updateVehicles(vehiclePositions);

      // Print the total count
      console.log(`Total vehicles found: ${vehiclePositions.length}`);

      if (vehiclePositions.length > 0) {
        // Print the table to the console
        console.log("\nVehicle Positions Summary (Console):");
        console.table(vehiclePositions);
      } else {
        console.log("No vehicle positions found in the feed.");
      }

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(
        `[${endTime.toISOString()}] Cycle finished in ${duration.toFixed(
          2
        )} seconds.`
      );
    } catch (error) {
      console.error(
        `\n[${new Date().toISOString()}] Error during fetch/process cycle:`,
        error.message
      );
    }
  }

  useEffect(() => {
    // Perform initial fetch
    fetchAndProcessData();

    // Set up periodic fetching
    const interval = setInterval(fetchAndProcessData, INTERVAL_MS);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  return null;
}
