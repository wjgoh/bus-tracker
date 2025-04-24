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
  busType?: string; // Added to track which bus type this vehicle belongs to
};

type VehicleStore = {
  vehicles: VehiclePosition[];
  selectedRoute: string;
  selectedBusType?: BusType;
  isLoading: boolean;
  setVehicles: (vehicles: VehiclePosition[]) => void;
  setSelectedRoute: (route: string) => void;
  setSelectedBusType: (busType?: BusType) => void;
  updateVehicles: (vehicles: VehiclePosition[]) => void;
  markInactiveVehicles: (activeVehicleIds: string[]) => void;
  loadVehiclesFromDatabase: () => Promise<void>;
};

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  selectedRoute: "all",
  selectedBusType: undefined,
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
  setSelectedBusType: (busType) => set({ selectedBusType: busType }),
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
  loadVehiclesFromDatabase: async () => {
    set({ isLoading: true });

    try {
      // Fetch both types of buses always
      const mrtFeederResponse = await fetch(
        `/api/getVehicleData?busType=mrtfeeder`
      );
      // Fetch KL buses
      const klResponse = await fetch(`/api/getVehicleData?busType=kl`);

      if (!mrtFeederResponse.ok || !klResponse.ok) {
        throw new Error(`API request failed`);
      }

      const mrtFeederResult = await mrtFeederResponse.json();
      const klResult = await klResponse.json();

      if (
        mrtFeederResult.success &&
        klResult.success &&
        mrtFeederResult.data &&
        klResult.data
      ) {
        // Add busType property to each vehicle for identification
        const mrtFeederVehicles = mrtFeederResult.data.map(
          (v: VehiclePosition) => ({
            ...v,
            busType: "mrtfeeder",
          })
        );

        const klVehicles = klResult.data.map((v: VehiclePosition) => ({
          ...v,
          busType: "kl",
        }));

        // Combine both sets of vehicles
        const combinedVehicles = [...mrtFeederVehicles, ...klVehicles];

        // Set vehicles from DB
        set({ vehicles: combinedVehicles });
        console.log(
          `Loaded ${combinedVehicles.length} vehicles from database (${mrtFeederVehicles.length} MRT feeder, ${klVehicles.length} KL)`
        );
      } else {
        console.error("Failed to load vehicles from database");
      }
    } catch (error) {
      console.error("Error loading vehicles from database:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
