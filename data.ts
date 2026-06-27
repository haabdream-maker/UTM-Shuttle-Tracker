/**
 * UTM Bus Tracker Data and Simulation Calculations
 */

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const STOPS: Record<string, Stop> = {
  CP: { id: "CP", name: "CP Stop", lat: 1.559817071903544, lng: 103.63490409827418 },
  JALAN_AMAL: { id: "JALAN_AMAL", name: "Jalan Amal (FKE)", lat: 1.5580162032146048, lng: 103.64022229437279 },
  KP: { id: "KP", name: "KP Stop", lat: 1.5587190616209474, lng: 103.64732342800342 },
  K9_K10: { id: "K9_K10", name: "K9/K10 Stop", lat: 1.5603939213123625, lng: 103.6487973360301 },
  KDOJ: { id: "KDOJ", name: "KDOJ Stop", lat: 1.57576000650592, lng: 103.61973156794734 },
  KDSE: { id: "KDSE", name: "KDSE Stop", lat: 1.5666565392628558, lng: 103.62709902751793 },
  KTR: { id: "KTR", name: "KTR Stop", lat: 1.5617635671730536, lng: 103.62948406283648 },
  KTHO: { id: "KTHO", name: "KTHO Stop", lat: 1.5638867153251204, lng: 103.62941156100541 },
  KTDI: { id: "KTDI", name: "KTDI Stop", lat: 1.5649807909152897, lng: 103.63401870951887 },
  V01: { id: "V01", name: "V01 Stop", lat: 1.5443633952454752, lng: 103.63182161599055 },
  CLUSTER: { id: "CLUSTER", name: "Cluster (T02/T08) Main Stop", lat: 1.564399505961806, lng: 103.6534892244123 },
  KTC: { id: "KTC", name: "KTC Stop", lat: 1.5571323017762062, lng: 103.64461344851348 },
  N24: { id: "N24", name: "N24 Stop", lat: 1.5626728449354932, lng: 103.63915207783187 },
  KRP_KTF: { id: "KRP_KTF", name: "KRP/KTF Stop", lat: 1.5581213922662231, lng: 103.62982766946291 },
};

// Bus Route details
export interface Route {
  id: string; // "BUS A", "BUS B", etc.
  name: string;
  color: string;
  stops: string[]; // List of Stop IDs
  zone: string; // Zone filter category
  description: string;
}

export const ROUTES: Route[] = [
  {
    id: "BUS A",
    name: "Route A (KP Loop)",
    color: "#ef4444", // Red
    stops: ["KP", "KTC", "CP", "JALAN_AMAL", "KTC", "KP"],
    zone: "East-Core",
    description: "Connects KP residential college with CP academic area and Jalan Amal via KTC.",
  },
  {
    id: "BUS B",
    name: "Route B (Cluster Loop)",
    color: "#3b82f6", // Blue
    stops: ["KP", "K9_K10", "CLUSTER", "K9_K10", "KP"],
    zone: "East-Residential",
    description: "Serves KP, K9/K10, and the Cluster T02/T08 academic areas.",
  },
  {
    id: "BUS C",
    name: "Route C (FKE-K9 Loop)",
    color: "#10b981", // Green
    stops: ["K9_K10", "CP", "JALAN_AMAL", "K9_K10"],
    zone: "East-Core",
    description: "Quick loop connecting K9/K10 with CP and FKE Jalan Amal.",
  },
  {
    id: "BUS D",
    name: "Route D (KDOJ Direct)",
    color: "#f59e0b", // Amber
    stops: ["KDOJ", "KDSE", "KRP_KTF", "CP", "KRP_KTF", "KDSE", "KDOJ"],
    zone: "West-Residential",
    description: "Connects distant KDOJ and KDSE colleges directly to CP academic center.",
  },
  {
    id: "BUS E",
    name: "Route E (KDOJ-Cluster Link)",
    color: "#8b5cf6", // Purple
    stops: ["KDOJ", "KDSE", "KRP_KTF", "CP", "N24", "CLUSTER", "KRP_KTF", "KDSE", "KDOJ"],
    zone: "West-Residential",
    description: "Comprehensive western route connecting KDOJ all the way to N24 and Cluster.",
  },
  {
    id: "BUS F",
    name: "Route F (KTR-CP East-West)",
    color: "#ec4899", // Pink
    stops: ["KTR", "KTHO", "KTDI", "JALAN_AMAL", "CP", "KTR"],
    zone: "North-Residential",
    description: "Connects northern residences (KTR, KTHO, KTDI) to Jalan Amal and CP.",
  },
  {
    id: "BUS G",
    name: "Route G (KTR-N24 Loop)",
    color: "#14b8a6", // Teal
    stops: ["KTR", "KTHO", "KTDI", "N24", "CP", "KTR"],
    zone: "North-Residential",
    description: "Connects northern residences to N24 and CP.",
  },
  {
    id: "BUS H",
    name: "Route H (V01 Shuttle)",
    color: "#6366f1", // Indigo
    stops: ["CP", "JALAN_AMAL", "V01", "CP"],
    zone: "South-Academic",
    description: "Academic core shuttle linking CP, Jalan Amal, and V01.",
  },
];

export const ZONES = [
  { id: "all", name: "All Zones" },
  { id: "East-Core", name: "East Campus Core" },
  { id: "East-Residential", name: "East Residential (K9/K10/KP)" },
  { id: "West-Residential", name: "West Residential (KDOJ/KDSE)" },
  { id: "North-Residential", name: "North Residential (KTR/KTHO/KTDI)" },
  { id: "South-Academic", name: "South Campus & V01" },
];

export const DAYS = ["Sun", "Mon", "Tue", "Wen", "Thu", "Fri", "Sat"];

// Haversine formula to calculate distance between coordinates in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

// Beautiful curve-following road segments (navigation routing) for UTM campus
export const WAYPOINTS: Record<string, [number, number][]> = {
  "KP-KTC": [
    [1.5587190616209474, 103.64732342800342],
    [1.5583, 103.6465],
    [1.5576, 103.6455],
    [1.5571323017762062, 103.64461344851348]
  ],
  "KTC-CP": [
    [1.5571323017762062, 103.64461344851348],
    [1.5562, 103.6415],
    [1.5568, 103.6385],
    [1.5585, 103.6360],
    [1.559817071903544, 103.63490409827418]
  ],
  "CP-JALAN_AMAL": [
    [1.559817071903544, 103.63490409827418],
    [1.5605, 103.6368],
    [1.5595, 103.6388],
    [1.5580162032146048, 103.64022229437279]
  ],
  "JALAN_AMAL-KTC": [
    [1.5580162032146048, 103.64022229437279],
    [1.5572, 103.6418],
    [1.5568, 103.6432],
    [1.5571323017762062, 103.64461344851348]
  ],
  "KP-K9_K10": [
    [1.5587190616209474, 103.64732342800342],
    [1.5595, 103.6480],
    [1.5603939213123625, 103.6487973360301]
  ],
  "K9_K10-CLUSTER": [
    [1.5603939213123625, 103.6487973360301],
    [1.5615, 103.6502],
    [1.5630, 103.6518],
    [1.564399505961806, 103.6534892244123]
  ],
  "K9_K10-CP": [
    [1.5603939213123625, 103.6487973360301],
    [1.5610, 103.6455],
    [1.5615, 103.6415],
    [1.5608, 103.6375],
    [1.559817071903544, 103.63490409827418]
  ],
  "JALAN_AMAL-K9_K10": [
    [1.5580162032146048, 103.64022229437279],
    [1.5585, 103.6432],
    [1.5592, 103.6465],
    [1.5603939213123625, 103.6487973360301]
  ],
  "KDOJ-KDSE": [
    [1.57576000650592, 103.61973156794734],
    [1.5732, 103.6215],
    [1.5701, 103.6241],
    [1.5682, 103.6258],
    [1.5666565392628558, 103.62709902751793]
  ],
  "KDSE-KRP_KTF": [
    [1.5666565392628558, 103.62709902751793],
    [1.5642, 103.6278],
    [1.5615, 103.6285],
    [1.5581213922662231, 103.62982766946291]
  ],
  "KRP_KTF-CP": [
    [1.5581213922662231, 103.62982766946291],
    [1.5583, 103.6315],
    [1.5590, 103.6332],
    [1.559817071903544, 103.63490409827418]
  ],
  "CP-N24": [
    [1.559817071903544, 103.63490409827418],
    [1.5608, 103.6362],
    [1.5618, 103.6378],
    [1.5626728449354932, 103.63915207783187]
  ],
  "N24-CLUSTER": [
    [1.5626728449354932, 103.63915207783187],
    [1.5632, 103.6425],
    [1.5635, 103.6465],
    [1.5628, 103.6505],
    [1.564399505961806, 103.6534892244123]
  ],
  "CLUSTER-KTC": [
    [1.564399505961806, 103.6534892244123],
    [1.5615, 103.6515],
    [1.5592, 103.6485],
    [1.5571323017762062, 103.64461344851348]
  ],
  "CLUSTER-KRP_KTF": [
    [1.564399505961806, 103.6534892244123],
    [1.5615, 103.6515],
    [1.5592, 103.6485],
    [1.5571323017762062, 103.64461344851348],
    [1.5562, 103.6405],
    [1.5568, 103.6365],
    [1.5573, 103.6325],
    [1.5581213922662231, 103.62982766946291]
  ],
  "KTC-KRP_KTF": [
    [1.5571323017762062, 103.64461344851348],
    [1.5562, 103.6405],
    [1.5568, 103.6365],
    [1.5573, 103.6325],
    [1.5581213922662231, 103.62982766946291]
  ],
  "KTR-KTHO": [
    [1.5617635671730536, 103.62948406283648],
    [1.5628, 103.6294],
    [1.5638867153251204, 103.62941156100541]
  ],
  "KTHO-KTDI": [
    [1.5638867153251204, 103.62941156100541],
    [1.5642, 103.6315],
    [1.5649807909152897, 103.63401870951887]
  ],
  "KTDI-JALAN_AMAL": [
    [1.5649807909152897, 103.63401870951887],
    [1.5630, 103.6358],
    [1.5605, 103.6375],
    [1.5592, 103.6388],
    [1.5580162032146048, 103.64022229437279]
  ],
  "KTDI-N24": [
    [1.5649807909152897, 103.63401870951887],
    [1.5638, 103.6360],
    [1.5632, 103.6378],
    [1.5626728449354932, 103.63915207783187]
  ],
  "JALAN_AMAL-V01": [
    [1.5580162032146048, 103.64022229437279],
    [1.5535, 103.6380],
    [1.5492, 103.6355],
    [1.5465, 103.6335],
    [1.5443633952454752, 103.63182161599055]
  ],
  "V01-CP": [
    [1.5443633952454752, 103.63182161599055],
    [1.5485, 103.6322],
    [1.5535, 103.6335],
    [1.5572, 103.6342],
    [1.559817071903544, 103.63490409827418]
  ],
  "CP-KTR": [
    [1.559817071903544, 103.63490409827418],
    [1.5605, 103.6325],
    [1.5612, 103.6308],
    [1.5617635671730536, 103.62948406283648]
  ]
};

// Global cache for OSRM fetched real road routes
export const ROUTE_CACHE: Record<string, [number, number][]> = {};

// Prefetch all unique stop-to-stop routes using OSRM real-world navigation API
export async function prefetchRealRoutes(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  // Collect all unique consecutive stop pairs
  const pairs: { s1: string; s2: string }[] = [];
  const added = new Set<string>();

  ROUTES.forEach((route) => {
    for (let i = 0; i < route.stops.length - 1; i++) {
      const s1 = route.stops[i];
      const s2 = route.stops[i + 1];
      const key1 = `${s1}-${s2}`;
      const key2 = `${s2}-${s1}`;
      if (!added.has(key1) && !added.has(key2)) {
        pairs.push({ s1, s2 });
        added.add(key1);
        added.add(key2);
      }
    }
  });

  let loaded = 0;
  const total = pairs.length;

  // Try loading existing cache from localStorage for instant boot
  try {
    const saved = localStorage.getItem("utm_route_cache");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(ROUTE_CACHE, parsed);
      // Still execute a non-blocking background refresh to ensure up-to-date data
    }
  } catch (e) {
    console.error("Failed to load route cache from localStorage:", e);
  }

  // Define OSRM routing request
  const fetchRouteSegment = async (s1: string, s2: string) => {
    const key = `${s1}-${s2}`;
    
    // If already in memory from localStorage or previous fetch, skip API request
    if (ROUTE_CACHE[key]) {
      loaded++;
      if (onProgress) onProgress(loaded, total);
      return;
    }

    const p1 = STOPS[s1];
    const p2 = STOPS[s2];
    if (!p1 || !p2) {
      loaded++;
      if (onProgress) onProgress(loaded, total);
      return;
    }

    try {
      // Use OSRM public API to fetch driving route between stops
      const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates as [number, number][]; // [lng, lat]
        const path: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
        ROUTE_CACHE[key] = path;
        
        // Persist to localStorage
        try {
          localStorage.setItem("utm_route_cache", JSON.stringify(ROUTE_CACHE));
        } catch (e) {
          // ignore storage quota errors
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch OSRM route for ${key}:`, e);
    } finally {
      loaded++;
      if (onProgress) onProgress(loaded, total);
    }
  };

  // Run fetches in small batches to respect the public OSRM server rate limits
  const batchSize = 3;
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    await Promise.all(batch.map(({ s1, s2 }) => fetchRouteSegment(s1, s2)));
    // Tiny polite delay between batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Retrieve detailed path coordinates between two stops, supporting bidirectional fallback
export function getDetailedPath(s1: string, s2: string): [number, number][] {
  const p1 = STOPS[s1];
  const p2 = STOPS[s2];
  if (!p1 || !p2) return [];

  const key = `${s1}-${s2}`;
  const reverseKey = `${s2}-${s1}`;

  // 1. Try real OSRM cached routes first
  if (ROUTE_CACHE[key]) {
    return ROUTE_CACHE[key];
  } else if (ROUTE_CACHE[reverseKey]) {
    return [...ROUTE_CACHE[reverseKey]].reverse();
  }

  // 2. Fallback to static Waypoints
  if (WAYPOINTS[key]) {
    return WAYPOINTS[key];
  } else if (WAYPOINTS[reverseKey]) {
    return [...WAYPOINTS[reverseKey]].reverse();
  }

  // 3. Last resort fallback to straight line
  return [
    [p1.lat, p1.lng],
    [p2.lat, p2.lng]
  ];
}

// Sum the distance of a route segment along the navigation waypoints
export function getRouteSegmentDistance(s1Id: string, s2Id: string): number {
  const path = getDetailedPath(s1Id, s2Id);
  let dist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    dist += calculateDistance(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
  }
  return dist;
}

// Linearly interpolate along a detailed polyline at a given ratio (0.0 to 1.0)
export function interpolatePolyline(points: [number, number][], ratio: number): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  if (ratio <= 0) return points[0];
  if (ratio >= 1) return points[points.length - 1];

  const segmentDistances: number[] = [];
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dist = calculateDistance(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  if (totalDistance === 0) return points[0];

  const targetDist = totalDistance * ratio;
  let accumulatedDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segmentDist = segmentDistances[i];
    if (accumulatedDist + segmentDist >= targetDist) {
      const segmentRatio = (targetDist - accumulatedDist) / segmentDist;
      const p1 = points[i];
      const p2 = points[i + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * segmentRatio;
      const lng = p1[1] + (p2[1] - p1[1]) * segmentRatio;
      return [lat, lng];
    }
    accumulatedDist += segmentDist;
  }

  return points[points.length - 1];
}

// Calculates travel time details for a route
// Returns:
// - totalDuration: total trip time in minutes
// - stopTimes: cumulative times at which the bus reaches each stop (starting at 0)
// - legDurations: durations of each leg in minutes
export interface RouteTimingDetails {
  totalDuration: number;
  stopArrivalTimes: number[]; // relative minutes from start
  stopDepartureTimes: number[]; // relative minutes from start
}

const BUS_SPEED_KMPH = 25; // 25 km/h average speed
const DWELL_TIME_MINS = 0.5; // 30 seconds wait at each stop

export function calculateRouteTimings(route: Route): RouteTimingDetails {
  const stopArrivalTimes: number[] = [0];
  const stopDepartureTimes: number[] = [0];
  let currentRelativeTime = 0;

  for (let i = 0; i < route.stops.length - 1; i++) {
    const s1 = STOPS[route.stops[i]];
    const s2 = STOPS[route.stops[i + 1]];
    if (!s1 || !s2) continue;

    // Distance in km using real curving road distance!
    const dist = getRouteSegmentDistance(route.stops[i], route.stops[i + 1]);
    // Travel time in minutes
    const travelTime = (dist / BUS_SPEED_KMPH) * 60;

    // Departure time for previous stop (after dwell time, except the first stop which leaves immediately at 0)
    if (i > 0) {
      stopDepartureTimes[i] = stopArrivalTimes[i] + DWELL_TIME_MINS;
    } else {
      stopDepartureTimes[0] = 0; // Starts right away
    }

    // Arrival time at next stop
    const arrivalAtNext = (i > 0 ? stopDepartureTimes[i] : 0) + travelTime;
    stopArrivalTimes.push(arrivalAtNext);
  }

  // Last stop has no dwell time for departure
  stopDepartureTimes.push(stopArrivalTimes[stopArrivalTimes.length - 1]);

  const totalDuration = stopArrivalTimes[stopArrivalTimes.length - 1];

  return {
    totalDuration,
    stopArrivalTimes,
    stopDepartureTimes,
  };
}

// Generate schedule of departure times (in minutes from midnight) for a route on a given day
// Normal active hours: 07:30 to 22:30 (Weekdays), 08:30 to 21:30 (Weekends: Sat, Sun)
export function getDepartureSchedules(routeId: string, day: string): number[] {
  const isWeekend = day === "Sun" || day === "Sat";
  const startHour = isWeekend ? 8.5 : 7.5; // 08:30 or 07:30
  const endHour = isWeekend ? 21.5 : 22.5; // 21:30 or 22:30
  
  // Custom frequencies based on bus route for added detail
  let frequencyMins = 30; // default
  if (routeId === "BUS A" || routeId === "BUS D") {
    frequencyMins = isWeekend ? 40 : 20; // more frequent primary routes
  } else if (routeId === "BUS E" || routeId === "BUS B") {
    frequencyMins = isWeekend ? 60 : 30;
  } else if (routeId === "BUS C" || routeId === "BUS H") {
    frequencyMins = isWeekend ? 45 : 25; // short loops
  } else {
    frequencyMins = isWeekend ? 50 : 30; // Route F & G
  }

  const departures: number[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  for (let m = startMinutes; m <= endMinutes; m += frequencyMins) {
    departures.push(m);
  }

  return departures;
}

// Information about an active running bus
export interface ActiveBus {
  busId: string; // e.g. "BUS A-10:30"
  routeId: string; // "BUS A"
  routeName: string;
  color: string;
  tripStartMins: number; // minutes from midnight
  elapsedMins: number;
  lat: number;
  lng: number;
  status: "boarding" | "travelling" | "arrived";
  currentLegIndex: number; // index in route.stops
  nextStopName: string;
  nextStopEtaMins: number; // Minutes until next stop
  allEtas: { stopId: string; stopName: string; etaMins: number; timeString: string }[];
  heading?: number; // direction in degrees (0-360)
}

// Calculate direction bearing between two coordinates
export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Compute active buses at a specific simulated day and time (minutes from midnight)
export function getActiveBuses(day: string, timeInMins: number): ActiveBus[] {
  const activeBuses: ActiveBus[] = [];

  for (const route of ROUTES) {
    const timings = calculateRouteTimings(route);
    const departures = getDepartureSchedules(route.id, day);

    for (const depMins of departures) {
      const elapsed = timeInMins - depMins;

      // Check if this trip is currently running
      if (elapsed >= 0 && elapsed <= timings.totalDuration) {
        // Find current position
        let lat = STOPS[route.stops[0]].lat;
        let lng = STOPS[route.stops[0]].lng;
        let status: "boarding" | "travelling" | "arrived" = "travelling";
        let currentLegIndex = 0;
        let nextStopName = "";
        let nextStopEtaMins = 0;
        let heading = 0;

        // Find the active segment
        for (let i = 0; i < route.stops.length - 1; i++) {
          const arrTime = timings.stopArrivalTimes[i];
          const depTime = timings.stopDepartureTimes[i];
          const nextArrTime = timings.stopArrivalTimes[i + 1];

          // Check if bus is boarding at stop i
          if (elapsed >= arrTime && elapsed <= depTime) {
            const stop = STOPS[route.stops[i]];
            lat = stop.lat;
            lng = stop.lng;
            status = "boarding";
            currentLegIndex = i;
            
            // Point towards the next stop
            const nextStop = STOPS[route.stops[i + 1]];
            if (nextStop) {
              heading = getBearing(lat, lng, nextStop.lat, nextStop.lng);
            }
            break;
          }

          // Check if bus is travelling between stop i and i+1
          if (elapsed > depTime && elapsed < nextArrTime) {
            const legTotalTime = nextArrTime - depTime;
            const legElapsed = elapsed - depTime;
            const ratio = legElapsed / legTotalTime;

            // Get the curving road detailed path
            const path = getDetailedPath(route.stops[i], route.stops[i + 1]);
            // Interpolate position along the curving polyline road path
            const [interpolatedLat, interpolatedLng] = interpolatePolyline(path, ratio);
            lat = interpolatedLat;
            lng = interpolatedLng;
            status = "travelling";
            currentLegIndex = i;

            // Calculate precise heading slightly ahead on the path
            const [nextLat, nextLng] = interpolatePolyline(path, Math.min(1.0, ratio + 0.03));
            heading = getBearing(lat, lng, nextLat, nextLng);
            break;
          }
        }

        // Calculate ETAs for all stops from this point forward
        const allEtas: ActiveBus["allEtas"] = [];
        for (let idx = 0; idx < route.stops.length; idx++) {
          const stopId = route.stops[idx];
          const stop = STOPS[stopId];
          if (!stop) continue;

          const arrTime = timings.stopArrivalTimes[idx];
          const etaMins = arrTime - elapsed;

          // If the bus hasn't passed or is currently at this stop
          if (etaMins >= -0.5) {
            const absoluteArrivalMins = depMins + arrTime;
            const h = Math.floor(absoluteArrivalMins / 60) % 24;
            const m = Math.floor(absoluteArrivalMins % 60);
            const timeString = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

            allEtas.push({
              stopId,
              stopName: stop.name,
              etaMins: Math.max(0, Math.round(etaMins)),
              timeString,
            });
          }
        }

        // Find next stop info
        const nextEtaObj = allEtas.find((e) => e.etaMins > 0) || allEtas[allEtas.length - 1];
        if (nextEtaObj) {
          nextStopName = nextEtaObj.stopName;
          nextStopEtaMins = nextEtaObj.etaMins;
        }

        // Create active bus object
        const tripHour = Math.floor(depMins / 60);
        const tripMin = Math.floor(depMins % 60);
        const tripTimeStr = `${tripHour.toString().padStart(2, "0")}:${tripMin.toString().padStart(2, "0")}`;

        activeBuses.push({
          busId: `${route.id}-${tripTimeStr}`,
          routeId: route.id,
          routeName: route.name,
          color: route.color,
          tripStartMins: depMins,
          elapsedMins: elapsed,
          lat,
          lng,
          status,
          currentLegIndex,
          nextStopName,
          nextStopEtaMins,
          allEtas,
          heading,
        });
      }
    }
  }

  return activeBuses;
}

// Convert minutes from midnight to digital clock string
export function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Get full list of schedules for all routes to display in sidebar
export interface RouteScheduleItem {
  routeId: string;
  routeName: string;
  color: string;
  zone: string;
  description: string;
  stops: Stop[];
  departures: string[];
}

export function getFullSchedules(day: string): RouteScheduleItem[] {
  return ROUTES.map((route) => {
    const departures = getDepartureSchedules(route.id, day).map((m) => minutesToTimeString(m));
    const stopsList = route.stops.map((id) => STOPS[id]).filter(Boolean) as Stop[];
    return {
      routeId: route.id,
      routeName: route.name,
      color: route.color,
      zone: route.zone,
      description: route.description,
      stops: stopsList,
      departures,
    };
  });
}
