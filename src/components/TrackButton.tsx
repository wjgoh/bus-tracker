"use client";

import { Button } from "@/components/ui/button";
import { useVehicleStore } from "@/store/vehicleStore";
import { useState } from "react";

export default function TrackButton() {
  const [isLoading, setIsLoading] = useState(false);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // We don't need to load vehicles on initial render here
  // as it's already being done in MapWrapper and VehicleDataFetcher
  // This prevents duplicate data loading and potential memory issues

  // Count active and inactive vehicles
  const activeVehicles = vehicles.filter((v) => v.isActive).length;
  const inactiveVehicles = vehicles.filter((v) => !v.isActive).length;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="default"
        className="mb-2 ml-0"
        onClick={async () => {
          setIsLoading(true);
          try {
            console.log("Manually fetching vehicle data...");
            const response = await fetch("/api/gtfs");

            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
              // Get the vehicle store update function
              const updateVehicles = useVehicleStore.getState().updateVehicles;
              updateVehicles(result.data);

              // After updating the UI, reload from database to ensure we have the latest data
              // including any vehicles that were marked inactive in the database
              await loadVehiclesFromDatabase();

              console.log(`Updated ${result.data.length} vehicles`);
            }
          } catch (error) {
            console.error("Error updating bus locations:", error);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Bus Location"}
      </Button>
      <div className="text-sm">
        <span className="text-green-600 font-medium">
          {activeVehicles} active
        </span>{" "}
        /
        <span className="text-gray-500 font-medium">
          {inactiveVehicles} inactive
        </span>{" "}
        buses
      </div>
    </div>
  );
}
