import { CircleMarker, Popup } from "react-leaflet";
import { useState, useEffect } from "react";

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

interface BusStopsProps {
  selectedRoute: string;
  stopsData?: string;
}

export default function BusStops({ selectedRoute, stopsData }: BusStopsProps) {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (!stopsData) return;

    // Parse stops.txt content
    const stopLines = stopsData
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const header = stopLines[0].split(",");
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

    setStops(parsedStops);
  }, [stopsData]);

  // Determine if we should show all stops or filter by route
  // For now, we'll show all stops since we don't have route-to-stop mapping
  // In a real app, you would filter stops based on the selected route
  const stopsToShow = stops;

  return (
    <>
      {stopsToShow.map((stop) => (
        <CircleMarker
          key={stop.stop_id}
          center={[stop.stop_lat, stop.stop_lon]}
          radius={5}
          pathOptions={{
            fillColor: "#ff7800",
            fillOpacity: 0.8,
            weight: 1,
            color: "#000",
            opacity: 1,
          }}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{stop.stop_name}</h3>
              <p>Stop ID: {stop.stop_id}</p>
              <p>Stop Code: {stop.stop_code}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}