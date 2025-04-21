import { create } from "zustand";
import { BusType } from "@/lib/db";

export type VehiclePosition = {
  tripId: string;
  routeId: string;
  vehicleId: string;
  latitude: string;
  longitude: string;
  timestamp: string;
  congestion: string;
  stopId: string;
  status: string;
  isActive: boolean; // Flag to track if the bus is currently active in the API
  lastSeen: string; // Timestamp when the bus was last seen
};

type VehicleStore = {
  vehicles: VehiclePosition[];
  selectedRoute: string;
  selectedBusType: BusType;
  isLoading: boolean;
  setVehicles: (vehicles: VehiclePosition[]) => void;
  setSelectedRoute: (route: string) => void;
  setSelectedBusType: (busType: BusType) => void;
  updateVehicles: (vehicles: VehiclePosition[]) => void;
  markInactiveVehicles: (activeVehicleIds: string[]) => void;
  loadVehiclesFromDatabase: (busType?: BusType) => Promise<void>;
};

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  selectedRoute: "all",
  selectedBusType: "mrtfeeder",
  isLoading: false,
  setVehicles: (vehicles) => {
    // When setting vehicles for the first time, mark them all as active
    const enhancedVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      isActive: true,
      lastSeen: new Date().toISOString(),
    }));
    set({ vehicles: enhancedVehicles });
  },
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  setSelectedBusType: (busType) =>
    set({
      selectedBusType: busType,
      // Reset route selection when changing bus type
      selectedRoute: "all",
    }),
  updateVehicles: (vehicles) =>
    set((state) => {
      const existingVehicles = new Map(
        state.vehicles.map((v) => [v.vehicleId, v])
      );

      // Update or add new vehicles
      vehicles.forEach((vehicle) => {
        const now = new Date().toISOString();
        // Removed unused existingVehicle declaration
        existingVehicles.set(vehicle.vehicleId, {
          ...vehicle,
          isActive: true,
          lastSeen: now,
        });
      });

      // Get the list of active vehicle IDs to mark inactive ones
      const activeVehicleIds = vehicles.map((v) => v.vehicleId);

      // Mark vehicles not in the current update as inactive
      state.vehicles.forEach((vehicle) => {
        if (!activeVehicleIds.includes(vehicle.vehicleId) && vehicle.isActive) {
          existingVehicles.set(vehicle.vehicleId, {
            ...vehicle,
            isActive: false,
          });
        }
      });

      return { vehicles: Array.from(existingVehicles.values()) };
    }),
  markInactiveVehicles: (activeVehicleIds) =>
    set((state) => {
      const updatedVehicles = state.vehicles.map((vehicle) => ({
        ...vehicle,
        isActive: activeVehicleIds.includes(vehicle.vehicleId),
      }));

      return { vehicles: updatedVehicles };
    }),
  loadVehiclesFromDatabase: async (busType) => {
    const currentBusType = busType || get().selectedBusType;
    set({ isLoading: true });
    try {
      const response = await fetch(
        `/api/getVehicleData?busType=${currentBusType}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Set vehicles from DB
        set({ vehicles: result.data });
        console.log(`Loaded ${result.data.length} vehicles from database`);
      } else {
        console.error("Failed to load vehicles from database:", result.error);
      }
    } catch (error) {
      console.error("Error loading vehicles from database:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
