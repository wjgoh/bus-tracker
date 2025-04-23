"use client";

import { useGtfsLoader } from "@/hooks/use-gtfs-loader";

export function GtfsLoader() {
  const { isLoading, error } = useGtfsLoader();

  // This component doesn't render anything visible
  // It just triggers the data fetching when mounted
  return null;
}
