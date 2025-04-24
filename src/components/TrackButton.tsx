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
            // Fetch MRT feeder buses
            console.log("Manually fetching all vehicle data...");

            // Fetch both bus types in parallel
            const [mrtResponse, klResponse] = await Promise.all([
              fetch("/api/gtfs?busType=mrtfeeder"),
              fetch("/api/gtfs?busType=kl"),
            ]);

            if (!mrtResponse.ok || !klResponse.ok) {
              throw new Error(`API request failed`);
            }

            // Parse the responses
            const mrtResult = await mrtResponse.json();
            const klResult = await klResponse.json();

            // Get the vehicle store update function
            const updateVehicles = useVehicleStore.getState().updateVehicles;

            // Update MRT feeder buses
            if (mrtResult.success && mrtResult.data) {
              updateVehicles(mrtResult.data);
              console.log(
                `Updated ${mrtResult.data.length} MRT feeder vehicles`
              );
            }

            // Update KL buses
            if (klResult.success && klResult.data) {
              updateVehicles(klResult.data);
              console.log(`Updated ${klResult.data.length} KL vehicles`);
            }

            // After updating the UI, reload all vehicles from database to ensure we have the latest data
            await loadVehiclesFromDatabase();

            console.log("All vehicle data has been updated");
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
