"use client";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect, useCallback, useMemo } from "react";
import RouteSelector from "@/components/ui/RouteSelector";
import { useVehicleStore } from "@/store/vehicleStore";

export default function MapWrapper() {
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const loadVehiclesFromDatabase = useVehicleStore(
    (state) => state.loadVehiclesFromDatabase
  );

  // Debounced route selection handling
  const handleRouteChange = useCallback((route: string) => {
    setSelectedRoute(route);
  }, []);

  // Effect to fetch stops data when route changes
  useEffect(() => {
    if (selectedRoute !== "all") {
      fetch("/api/stops");
    }
  }, [selectedRoute]);

  // Set up refresh for vehicle data only
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchVehicleData() {
      await loadVehiclesFromDatabase();
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase]);

  // Memoize the dynamic Map component to prevent unnecessary re-creation
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/Map"), {
        ssr: false,
        loading: () => <p>Loading map...</p>,
      }),
    []
  );

  return (
    <div className="relative w-full h-full">
      <div className="z-10 relative">
        <RouteSelector
          selectedRoute={selectedRoute}
          onRouteChange={handleRouteChange}
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
