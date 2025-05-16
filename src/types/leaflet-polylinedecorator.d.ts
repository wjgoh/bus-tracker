import * as L from "leaflet";

declare module "leaflet" {
  // Define a proper interface for symbol objects
  interface DirectionPoint {
    angle: number; // Direction angle in radians
    p1: L.Point; // Start point
    p2?: L.Point; // End point (optional)
    pixelSize?: number;
  }

  interface SymbolObject {
    initialize(options: Record<string, unknown>): void;
    buildSymbol(
      dirPoint: DirectionPoint,
      latLngs: L.LatLng[],
      map: L.Map
    ): L.Layer;
  }

  interface PolylineDecoratorOptions {
    patterns: Array<{
      offset?: number;
      repeat?: number;
      symbol: SymbolObject;
    }>;
  }

  class PolylineDecorator extends L.Layer {
    constructor(
      polyline: L.Polyline | L.LatLng[],
      options?: PolylineDecoratorOptions
    );
    addTo(map: L.Map): this;
  }

  namespace Symbol {
    interface ArrowHeadOptions {
      pixelSize?: number;
      polygon?: boolean;
      pathOptions?: L.PathOptions;
    }

    function arrowHead(options?: ArrowHeadOptions): SymbolObject;
  }

  function polylineDecorator(
    polyline: L.Polyline | L.LatLng[],
    options?: PolylineDecoratorOptions
  ): PolylineDecorator;
}

declare module "leaflet-polylinedecorator" {}
