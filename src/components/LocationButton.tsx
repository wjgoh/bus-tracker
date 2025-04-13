"use client";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface LocationButtonProps {
  onLocationFound: (coords: { lat: number; lng: number }) => void;
}

export default function LocationButton({
  onLocationFound,
}: LocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationFound({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError(
          err.code === 1
            ? "Location access denied. Please enable location services."
            : "Unable to get your location"
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 bg-white"
        onClick={handleGetLocation}
        disabled={isLoading}
      >
        <FontAwesomeIcon
          icon={faLocationCrosshairs}
          className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`}
        />
        <span className="sr-only">My Location</span>
      </Button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
