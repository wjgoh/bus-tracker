import { create } from "zustand";

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

interface StopsState {
  stops: Stop[];
  stopsData: string;
  isLoading: boolean;
  fetchStopsData: () => Promise<void>;
}

export const useStopsStore = create<StopsState>((set) => ({
  stops: [],
  stopsData: "",
  isLoading: false,

  fetchStopsData: async () => {
    // Only fetch once if we already have data
    set((state) => {
      if (state.stopsData) return state;
      return { isLoading: true };
    });

    try {
      const response = await fetch("/api/stops");
      const data = await response.text();

      // Parse the stops data
      const stopLines = data
        .split("\n")
        .filter((line) => line.trim().length > 0);
      const parsedStops = stopLines.slice(1).map((line) => {
        const values = line.split(",");
        return {
          stop_id: values[0],
          stop_code: values[1],
          stop_name: values[2],
          stop_lat: parseFloat(values[3]),
          stop_lon: parseFloat(values[4]),
        };
      });

      set({
        stopsData: data,
        stops: parsedStops,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching stops data:", error);
      set({ isLoading: false });
    }
  },
}));
