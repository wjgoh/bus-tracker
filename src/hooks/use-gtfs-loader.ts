"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to fetch and unzip GTFS data when the component mounts
 */
export function useGtfsLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGtfsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Call the API route to update GTFS data
        const response = await fetch("/api/update-gtfs");
        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Failed to update GTFS data");
        }
      } catch (err) {
        setError("Error fetching GTFS data");
        console.error("Error fetching GTFS data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGtfsData();
  }, []); // Empty dependency array means this runs once on mount

  return { isLoading, error };
}
