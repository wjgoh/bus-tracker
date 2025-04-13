"use client";

import { useEffect } from "react";
import { useVehicleStore } from "@/store/vehicleStore";

const INTERVAL_SECONDS = 30;
const INTERVAL_MS = INTERVAL_SECONDS * 1000;

export function VehicleDataFetcher() {
  // Vehicle data fetching now handled in MapWrapper.tsx.
  return null;
}
