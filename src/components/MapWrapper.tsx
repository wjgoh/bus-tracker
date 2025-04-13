"use client";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect } from "react";
import RouteSelector from "@/components/ui/RouteSelector";
import { useVehicleStore } from "@/store/vehicleStore";

export default function MapWrapper() {
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // Set up automatic refresh every 30 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    async function fetchAndSyncVehicleData() {
      // 1. First load existing vehicle data for immediate display
      await loadVehiclesFromDatabase();

      // 2. Fetch fresh GTFS data in background
      const gtfsRes = await fetch("/api/gtfs");
      const gtfsJson = await gtfsRes.json();
      if (!gtfsJson.success) return;
      const vehiclePositions = gtfsJson.data;

      // 3. Save updated data to database
      await fetch("/api/saveVehicleData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles: vehiclePositions }),
      });

      // 4. Only fetch stops data when a specific route is selected
      if (selectedRoute !== "all") {
        await fetch("/api/stops");
      }

      // 5. Reload vehicles to reflect latest changes
      await loadVehiclesFromDatabase();
    }

    fetchAndSyncVehicleData(); // initial load
    intervalId = setInterval(fetchAndSyncVehicleData, 30000);
    return () => clearInterval(intervalId);
  }, [loadVehiclesFromDatabase, selectedRoute]);

  const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p>Loading map...</p>,
  });

  return (
    <div className="relative w-full h-full">
      <div className="z-10 relative">
        <RouteSelector
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
        />
      </div>
      <div className="w-full h-[calc(100%-60px)] relative z-0">
        <Suspense fallback={<div>Loading...</div>}>
          <Map selectedRoute={selectedRoute} />
        </Suspense>
      </div>
    </div>
  );
}
