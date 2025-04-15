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

  // Set up refresh from database only
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchVehicleData() {
      // Only load from database - no more GTFS API calls
      await loadVehiclesFromDatabase();
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase]); // Removed selectedRoute from dependency array

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
