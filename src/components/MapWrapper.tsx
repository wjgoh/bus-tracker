"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export default function MapWrapper() {
  const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p>Loading map...</p>,
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Map />
    </Suspense>
  );
}
