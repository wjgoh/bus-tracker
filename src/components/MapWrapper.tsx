"use client";
import dynamic from "next/dynamic";
import { useState, Suspense } from "react";
import RouteSelector from "@/components/ui/RouteSelector";

export default function MapWrapper() {
  const [selectedRoute, setSelectedRoute] = useState<string>("all");

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
