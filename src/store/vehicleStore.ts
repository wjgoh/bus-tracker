import { create } from "zustand";

type VehiclePosition = {
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
  setVehicles: (vehicles: VehiclePosition[]) => void;
  updateVehicles: (vehicles: VehiclePosition[]) => void;
  markInactiveVehicles: (activeVehicleIds: string[]) => void;
};

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  setVehicles: (vehicles) => {
    // When setting vehicles for the first time, mark them all as active
    const enhancedVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      isActive: true,
      lastSeen: new Date().toISOString(),
    }));
    set({ vehicles: enhancedVehicles });
  },
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
}));
