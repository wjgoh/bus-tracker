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

  // Set up refresh from database only (frequent updates for UI smoothness)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchVehicleData() {
      // Only load from database - for UI updates
      await loadVehiclesFromDatabase();

      // Only fetch stops data when a specific route is selected
      if (selectedRoute !== "all") {
        await fetch("/api/stops");
      }
    }

    fetchVehicleData(); // initial load
    intervalId = setInterval(fetchVehicleData, 5000); // Fast UI updates
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadVehiclesFromDatabase, selectedRoute]);

  // Add new effect for GTFS API updates every 30 seconds
  useEffect(() => {
    let gtfsIntervalId: NodeJS.Timeout | null = null;

    async function fetchFromGtfsApi() {
      try {
        console.log("Fetching data from /api/gtfs...");
        const response = await fetch("/api/gtfs");
        if (response.ok) {
          console.log("GTFS data updated successfully");
        } else {
          console.error("Failed to update GTFS data:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching GTFS data:", error);
      }
    }

    fetchFromGtfsApi(); // Initial GTFS fetch
    gtfsIntervalId = setInterval(fetchFromGtfsApi, 5000); // Every 30 seconds

    return () => {
      if (gtfsIntervalId) clearInterval(gtfsIntervalId);
    };
  }, []);

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
