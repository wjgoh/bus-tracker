import React, { useEffect, useRef, useCallback } from "react";
import { Polyline, useMap } from "react-leaflet";
import { RouteShape } from "@/lib/gtfs/routeUtil";
import L from "leaflet";
import "leaflet-polylinedecorator";

interface RouteShapeProps {
  shapes: RouteShape[];
  color?: string;
  arrowStyle?: 'default' | 'elegant' | 'minimal';
}

const RouteShapeComponent: React.FC<RouteShapeProps> = ({
  shapes,
  color = "#3388ff",
  arrowStyle = 'default',
}) => {
  const map = useMap();
  const polylineRefs = useRef<Map<string, L.Polyline>>(new Map());
  const decoratorsRef = useRef<L.PolylineDecorator[]>([]);

  // Cleanup function for previous decorators
  const cleanupDecorators = useCallback(() => {
    decoratorsRef.current.forEach((decorator) => {
      if (map) {
        map.removeLayer(decorator);
      }
    });
    decoratorsRef.current = [];
  }, [map]);

  // Add directional arrows when shapes or map changes
  useEffect(() => {
    // Wait for a short time to ensure polylines are rendered
    const timer = setTimeout(() => {
      // Clean up previous decorators
      cleanupDecorators();

      shapes.forEach((shape) => {
        const polylineObj = polylineRefs.current.get(shape.shape_id);
        
        if (polylineObj && shape.points.length > 2) {
          // Get arrow pattern based on selected style
          const patterns = getArrowPatterns(arrowStyle, color);
          
          const decorator = L.polylineDecorator(polylineObj, {
            patterns,
          });
          
          decorator.addTo(map);
          decoratorsRef.current.push(decorator);
        }
      });
    }, 100); // Short delay to ensure polylines are rendered
    
    return () => {
      clearTimeout(timer);
      cleanupDecorators();
    };
  }, [shapes, map, color, arrowStyle, cleanupDecorators]);

  return (
    <>
      {shapes.map((shape) => (
        <Polyline
          key={shape.shape_id}
          positions={shape.points}
          color={color}
          weight={5}
          opacity={0.7}
          eventHandlers={{
            add: (event) => {
              // Store reference to the native Leaflet polyline 
              polylineRefs.current.set(shape.shape_id, event.target);
            },
            remove: () => {
              polylineRefs.current.delete(shape.shape_id);
            },
          }}
        />
      ))}
    </>
  );
};

// Helper function to get appropriate arrow patterns based on style
const getArrowPatterns = (style: 'default' | 'elegant' | 'minimal', color: string) => {
  // Instead of using SVG arrows with markers which have rotation issues,
  // we'll go back to using the built-in arrowHead but customize it to look more like a static arrow
  const createStaticArrowSymbol = (size: number, weight: number) => {
    return L.Symbol.arrowHead({
      pixelSize: size,
      polygon: false,
      pathOptions: {
        stroke: true,
        weight: weight,
        color: color,
        opacity: 0.8,
        fill: false,
        fillOpacity: 0
      }
    });
  };

  switch (style) {
    case 'elegant':
      return [
        {
          offset: 50,
          repeat: 120,
          symbol: createStaticArrowSymbol(14, 2)
        }
      ];
    case 'minimal':
      return [
        {
          offset: 25,
          repeat: 150,
          symbol: createStaticArrowSymbol(10, 1)
        }
      ];
    default:
      return [
        {
          offset: 50,
          repeat: 150,
          symbol: createStaticArrowSymbol(16, 2.5)
        }
      ];
  }
};

export default RouteShapeComponent;