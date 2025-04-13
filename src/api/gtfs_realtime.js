"use client";

// Removed: import { useEffect } from "react"; // unused
// Removed: import { useVehicleStore } from "../store/vehicleStore"; // unused

const INTERVAL_SECONDS = 30;
const INTERVAL_MS = INTERVAL_SECONDS * 1000;

export function VehicleDataFetcher() {
  // Vehicle data fetching now handled in MapWrapper.tsx.
  return null;
}

// Removed: const INTERVAL_MS = 10000; // assigned but never used
