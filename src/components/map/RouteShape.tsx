import React from "react";
import { Polyline } from "react-leaflet";
import { RouteShape } from "@/lib/gtfs/routeUtil";

interface RouteShapeProps {
  shapes: RouteShape[];
  color?: string;
}

const RouteShapeComponent: React.FC<RouteShapeProps> = ({
  shapes,
  color = "#3388ff",
}) => {
  return (
    <>
      {shapes.map((shape) => (
        <Polyline
          key={shape.shape_id} // Add unique key prop using shape_id
          positions={shape.points}
          color={color}
          weight={5}
          opacity={0.7}
        />
      ))}
    </>
  );
};

export default RouteShapeComponent;
