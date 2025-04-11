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
};

type VehicleStore = {
  vehicles: VehiclePosition[];
  setVehicles: (vehicles: VehiclePosition[]) => void;
  updateVehicles: (vehicles: VehiclePosition[]) => void;
};

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  setVehicles: (vehicles) => set({ vehicles }),
  updateVehicles: (vehicles) =>
    set((state) => {
      const existingVehicles = new Map(
        state.vehicles.map((v) => [v.vehicleId, v])
      );

      // Update or add new vehicles
      vehicles.forEach((vehicle) => {
        existingVehicles.set(vehicle.vehicleId, vehicle);
      });

      return { vehicles: Array.from(existingVehicles.values()) };
    }),
}));
