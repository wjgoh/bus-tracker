"use client";

import { Button } from "@/components/ui/button";
import { useVehicleStore } from "@/store/vehicleStore";
import { useState } from "react";

export default function TrackButton() {
  // Use the isLoading state directly from the store
  const isLoading = useVehicleStore((state) => state.isLoading);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // Count active and inactive vehicles directly from the store state
  const activeVehicles = vehicles.filter((v) => v.isActive).length;
  const inactiveVehicles = vehicles.filter((v) => !v.isActive).length;

  // Local loading state specifically for the button click action,
  // distinct from the store's global loading state
  const [isButtonClickLoading, setIsButtonClickLoading] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="default"
        className="mb-2 ml-0"
        onClick={async () => {
          // Use the local loading state for the button feedback
          setIsButtonClickLoading(true);
          try {
            console.log("Manually triggering vehicle data refresh...");
            // Simply call the store's function to reload data
            await loadVehiclesFromDatabase();
            console.log("Vehicle data refreshed.");
          } catch (error) {
            console.error("Error refreshing bus locations:", error);
          } finally {
            // Reset the local button loading state
            setIsButtonClickLoading(false);
          }
        }}
        // Disable button based on the local click loading state
        disabled={isButtonClickLoading || isLoading}
      >
        {isButtonClickLoading || isLoading
          ? "Updating..."
          : "Update Bus Location"}
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
