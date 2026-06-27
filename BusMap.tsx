import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { STOPS, ROUTES, Stop, ActiveBus, Route, getDetailedPath, getBearing } from "../data";

interface BusMapProps {
  activeBuses: ActiveBus[];
  selectedBus: ActiveBus | null;
  onSelectBus: (bus: ActiveBus | null) => void;
  selectedZone: string;
  theme: "light" | "dark";
  selectedRoutes: string[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string | null) => void;
}

export default function BusMap({
  activeBuses,
  selectedBus,
  onSelectBus,
  selectedZone,
  theme,
  selectedRoutes,
  selectedStopId,
  onSelectStop,
}: BusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // Layer groups to easily clear and update markers/paths
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const busesLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRefs = useRef<Record<string, L.Polyline>>({});

  // Center coordinates for UTM Campus, Johor Bahru
  const utmCenter: L.LatLngExpression = [1.5615, 103.636];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Leaflet Map centered on UTM
    const map = L.map(mapContainerRef.current, {
      center: utmCenter,
      zoom: 14.2,
      zoomControl: false,
      attributionControl: false, // Clean look, attribution placed elegantly or omitted
    });

    mapRef.current = map;

    // Add zoom control to bottom right instead of top left
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Beautiful Minimalist Map Tile Layer (CartoDB)
    const initialTileUrl = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Initialize Layers
    stopsLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    busesLayerRef.current = L.layerGroup().addTo(map);

    // Set up ResizeObserver to handle container size changes cleanly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when Theme changes dynamically
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const nextUrl = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    tileLayerRef.current.setUrl(nextUrl);
  }, [theme]);

  // Update stops markers when zone filters change
  useEffect(() => {
    const map = mapRef.current;
    const stopsLayer = stopsLayerRef.current;
    if (!map || !stopsLayer) return;

    stopsLayer.clearLayers();

    // Add each stop as a custom glass dot marker
    Object.values(STOPS).forEach((stop) => {
      // Determine if stop is in filtered zone
      // Check which routes pass through this stop to decide its zone
      const routesPassing = ROUTES.filter((r) => r.stops.includes(stop.id));
      const isFiltered =
        selectedZone === "all" ||
        routesPassing.some((r) => r.zone === selectedZone);

      if (!isFiltered) return;

      const stopRoutesList = routesPassing.map((r) => r.id).join(", ");
      const isSelected = selectedStopId === stop.id;

      // Create a standard, highly recognizable circular transit bus stop icon
      const customStopIcon = L.divIcon({
        className: "custom-stop-marker",
        html: `
          <div class="group relative flex flex-col items-center justify-center">
            <!-- Glowing outer halo -->
            <div class="absolute -inset-1.5 ${isSelected ? "bg-emerald-500/30 scale-125 opacity-100 animate-pulse" : "bg-blue-500/15 opacity-0 group-hover:opacity-100"} rounded-full blur-sm transition-all duration-300"></div>
            
            <!-- Modern Leaflet Stop Pin -->
            <div class="relative flex flex-col items-center">
              <!-- Pin Body: Rounded-full with white background, colored border -->
              <div class="w-6 h-6 rounded-full bg-white border-2 ${isSelected ? "border-emerald-500" : "border-blue-600"} shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <!-- High-contrast Bus Icon inside -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 ${isSelected ? "text-emerald-500" : "text-blue-600"}">
                  <path d="M4 16c0 .55.45 1 1 1h1v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h1c.55 0 1-.45 1-1V4c0-2.21-1.79-4-4-4H7C4.79 0 3 1.79 3 4v12zm3-12h10v3H7V4zm0 5h10v5H7V9zm1.5 8c-.83 0-1.5-.67-1.5-1.5S7.67 14 8.5 14s1.5.67 1.5 1.5S9.33 17 8.5 17zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <!-- Little pointer triangle at the bottom of the pin -->
              <div class="w-1.5 h-1.5 ${isSelected ? "bg-emerald-500" : "bg-blue-600"} rotate-45 -mt-1 shadow-sm transition-all duration-300"></div>
            </div>

            <!-- Stop ID Floating Pill -->
            <div class="mt-1 ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-950/90 text-white border border-white/10"} px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wide shadow-sm transition-colors">
              ${stop.id === "JALAN_AMAL" ? "AMAL" : stop.id === "KRP_KTF" ? "KRP/KTF" : stop.id === "K9_K10" ? "K9/10" : stop.id}
            </div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 21],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customStopIcon })
        .addTo(stopsLayer)
        .on("click", () => {
          onSelectStop(stop.id);
          map.panTo([stop.lat, stop.lng]);
        })
        .bindTooltip(
          `
          <div class="p-1.5 font-sans">
            <p class="font-bold text-slate-800 text-xs">${stop.name}</p>
            <p class="text-[10px] text-slate-500 font-medium mt-0.5">Routes: ${stopRoutesList || "None"}</p>
          </div>
          `,
          {
            direction: "top",
            offset: [0, -10],
            className: "bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-xl font-sans p-0",
          }
        );
    });
  }, [selectedZone, selectedStopId]);

  // Update Route Polylines
  useEffect(() => {
    const map = mapRef.current;
    const routesLayer = routesLayerRef.current;
    if (!map || !routesLayer) return;

    // Clear existing polylines
    routesLayer.clearLayers();
    polylineRefs.current = {};

    // Draw lines for each route
    ROUTES.forEach((route) => {
      // Check if route matches current filter
      const isFiltered = selectedZone === "all" || route.zone === selectedZone;
      if (!isFiltered) return;

      // Filter by selected route checklist
      const isRouteChecked = selectedRoutes.includes(route.id);
      if (!isRouteChecked) return;

      const coordinates: L.LatLngTuple[] = [];
      for (let i = 0; i < route.stops.length - 1; i++) {
        const path = getDetailedPath(route.stops[i], route.stops[i + 1]);
        path.forEach(([lat, lng], idx) => {
          if (i > 0 && idx === 0) return; // avoid duplicate joint points
          coordinates.push([lat, lng] as L.LatLngTuple);
        });
      }

      // Is this route selected (either directly or through an active bus)
      const isSelected =
        selectedBus?.routeId === route.id;

      const polyline = L.polyline(coordinates, {
        color: route.color,
        weight: isSelected ? 6 : 3.5,
        opacity: isSelected ? 0.9 : 0.45,
        lineCap: "round",
        lineJoin: "round",
        dashArray: isSelected ? undefined : "6, 6",
      })
        .addTo(routesLayer)
        .bindTooltip(
          `<span class="font-bold font-sans text-xs" style="color: ${route.color}">${route.id}: ${route.name}</span>`,
          { sticky: true, className: "bg-white/95 backdrop-blur border border-slate-200/80 rounded-lg py-1 px-2 text-[11px]" }
        );

      polylineRefs.current[route.id] = polyline;

      // Draw directional arrowheads along the coordinates
      const step = 15; // Place an arrow every 15 coordinate points
      for (let i = 4; i < coordinates.length - 4; i += step) {
        const p1 = coordinates[i];
        const p2 = coordinates[i + 1];
        if (!p1 || !p2) continue;
        const bearing = getBearing(p1[0], p1[1], p2[0], p2[1]);
        
        const arrowSize = isSelected ? 14 : 10;
        const arrowOpacity = isSelected ? 0.95 : 0.65;
        
        const arrowIcon = L.divIcon({
          html: `
            <div style="transform: rotate(${bearing}deg); transform-origin: 50% 50%; color: ${route.color}; opacity: ${arrowOpacity};" class="flex items-center justify-center animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: ${arrowSize}px; height: ${arrowSize}px;" class="drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">
                <path d="M12 3l10 16H2L12 3z" />
              </svg>
            </div>
          `,
          className: "bg-transparent border-none",
          iconSize: [arrowSize, arrowSize],
          iconAnchor: [arrowSize / 2, arrowSize / 2],
        });

        L.marker(p1, { icon: arrowIcon, interactive: false })
          .addTo(routesLayer);
      }
    });
  }, [selectedZone, selectedBus, selectedRoutes]);

  // Update active buses markers
  useEffect(() => {
    const map = mapRef.current;
    const busesLayer = busesLayerRef.current;
    if (!map || !busesLayer) return;

    busesLayer.clearLayers();

    activeBuses.forEach((bus) => {
      // Is this bus in the filtered zone?
      const route = ROUTES.find((r) => r.id === bus.routeId);
      if (!route) return;

      const isFiltered = selectedZone === "all" || route.zone === selectedZone;
      if (!isFiltered) return;

      const isSelected = selectedBus?.busId === bus.busId;
      const busLetter = bus.routeId.replace("BUS ", "");
      const isBoarding = bus.status === "boarding";
      const animationClass = isBoarding ? "animate-bus-boarding" : "animate-bus-icon";

      // Create a beautiful rectangular bus marker parallel to the road of travel
      const customBusIcon = L.divIcon({
        className: "custom-bus-marker",
        html: `
          <div class="relative flex items-center justify-center transition-all duration-300 ${animationClass} ${isSelected ? "scale-115" : "hover:scale-105"}">
            <!-- Pulsing outer colored shadow -->
            <div style="background-color: ${bus.color};" class="absolute w-12 h-12 rounded-full opacity-35 animate-ping"></div>
            
            <!-- Rectangular Bus Body rotated parallel to the road travel direction -->
            <div style="transform: rotate(${bus.heading || 0}deg); transform-origin: 50% 50%; background-color: ${bus.color};" class="relative w-7 h-12 rounded-lg shadow-2xl border-2 border-white flex flex-col items-center justify-between py-1 select-none transition-transform duration-300">
              <!-- Front Windshield Detail pointing in direction of travel (Up in local coords) -->
              <div class="w-5 h-2 bg-slate-950/80 rounded-t-sm border-b border-white/10 flex-shrink-0"></div>
              
              <!-- Bold Route Letter in the center, rotated back by -heading so it is always upright and readable -->
              <div style="transform: rotate(${- (bus.heading || 0)}deg);" class="font-black text-[11px] text-white leading-none flex items-center justify-center drop-shadow-md">
                ${busLetter}
              </div>

              <!-- Tail Lights Detail (Rear of the bus) -->
              <div class="w-5 h-1 bg-slate-950/40 rounded-b-xs flex justify-between px-0.5 flex-shrink-0">
                <div class="w-1 h-0.5 bg-red-500 rounded-full"></div>
                <div class="w-1 h-0.5 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([bus.lat, bus.lng], { icon: customBusIcon })
        .addTo(busesLayer)
        .on("click", () => {
          onSelectBus(bus);
        });

      // Bind simple tooltip indicating bus route and state
      marker.bindTooltip(
        `
        <div class="px-2 py-1 font-sans text-xs">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${bus.color}"></span>
            <span class="font-extrabold text-slate-800">${bus.routeId}</span>
          </div>
          <p class="text-[10px] text-slate-500 font-medium">Status: <span class="capitalize font-semibold text-slate-700">${bus.status}</span></p>
          <p class="text-[10px] text-slate-500 font-medium">Next: <span class="font-semibold text-slate-700">${bus.nextStopName}</span></p>
        </div>
        `,
        {
          direction: "top",
          offset: [0, -18],
          className: "bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-0",
        }
      );

      // If this bus is selected, pan the map slightly to it
      if (isSelected) {
        // Only pan if it's not already centered to avoid jumpiness during auto-updates
        const currentCenter = map.getCenter();
        const dist = calculateDistance(currentCenter.lat, currentCenter.lng, bus.lat, bus.lng);
        if (dist > 0.4) {
          map.panTo([bus.lat, bus.lng]);
        }
      }
    });
  }, [activeBuses, selectedBus, selectedZone, onSelectBus]);

  // Helper distance function
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <div id="map-frame" className="w-full h-full relative">
      {/* Actual Map Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Decorative UTM Map Floating Banner (Sleek Glassmorphic) */}
      <div className="absolute top-24 left-4 z-10 pointer-events-none md:block hidden">
        <div className="glass-card-dark rounded-2xl p-3 max-w-xs flex flex-col gap-1.5 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-bold text-emerald-300 tracking-wide uppercase">Live Simulation Active</span>
          </div>
          <p className="text-xs text-slate-200/90 font-medium leading-relaxed">
            Bus positions are dynamically calculated based on actual UTM routes, stops, distances, and current simulated day & time.
          </p>
        </div>
      </div>
    </div>
  );
}
