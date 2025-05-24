import { create } from "zustand";

interface StopStore {
  activeStopId: string | null;
  setActiveStopId: (stopId: string | null) => void;
}

export const useStopStore = create<StopStore>((set) => ({
  activeStopId: null,
  setActiveStopId: (stopId) => set({ activeStopId: stopId }),
}));