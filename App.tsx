import React, { useState, useEffect } from "react";
import {
  Menu,
  RotateCcw,
  Clock,
  Calendar,
  X,
  Bus,
  MapPin,
  ChevronRight,
  Sliders,
  Sparkles,
  Info,
  Compass,
  Sun,
  Moon
} from "lucide-react";
import BusMap from "./components/BusMap";
import Sidebar from "./components/Sidebar";
import {
  STOPS,
  ROUTES,
  ZONES,
  DAYS,
  getActiveBuses,
  ActiveBus,
  minutesToTimeString,
  prefetchRealRoutes,
} from "./data";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentDay, setCurrentDay] = useState("Mon");
  const [timeInMins, setTimeInMins] = useState(480); // Default to 08:00 AM
  const [isLive, setIsLive] = useState(true);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([
    "BUS A",
    "BUS B",
    "BUS C",
    "BUS D",
    "BUS E",
    "BUS F",
    "BUS G",
    "BUS H",
  ]);
  const [routeLoadingState, setRouteLoadingState] = useState<{ loaded: number; total: number; isDone: boolean }>({
    loaded: 0,
    total: 0,
    isDone: false,
  });

  const handleToggleRoute = (routeId: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeId)
        ? prev.filter((id) => id !== routeId)
        : [...prev, routeId]
    );
  };

  // Prefetch OSRM real GPS driving paths on boot
  useEffect(() => {
    prefetchRealRoutes((loaded, total) => {
      setRouteLoadingState({ loaded, total, isDone: loaded === total });
    });
  }, []);

  // Synchronize with actual user clock when in "Live" mode
  useEffect(() => {
    if (!isLive) return;

    const updateClock = () => {
      const now = new Date();
      // Map JS getDay() (0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat)
      const daysMapped = ["Sun", "Mon", "Tue", "Wen", "Thu", "Fri", "Sat"]; // user requested 'Wen' for Wed
      const sysDay = daysMapped[now.getDay()];
      const sysMins = now.getHours() * 60 + now.getMinutes();
      
      setCurrentDay(sysDay);
      setTimeInMins(sysMins);
    };

    updateClock(); // Run immediately
    const interval = setInterval(updateClock, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  // Compute active buses at current simulated time
  const rawActiveBuses = getActiveBuses(currentDay, timeInMins);
  const activeBuses = rawActiveBuses.filter((b) => selectedRoutes.includes(b.routeId));

  // Find currently selected bus object from the active list
  const selectedBus = activeBuses.find((b) => b.busId === selectedBusId) || null;

  // Find currently selected stop object
  const selectedStop = selectedStopId ? STOPS[selectedStopId] : null;

  // Calculate upcoming buses for the selected stop
  const upcomingBusesAtStop = selectedStopId
    ? activeBuses
        .map((bus) => {
          const etaInfo = bus.allEtas.find((e) => e.stopId === selectedStopId);
          if (!etaInfo) return null;
          return {
            bus,
            etaMins: etaInfo.etaMins,
            timeString: etaInfo.timeString,
          };
        })
        .filter((b): b is { bus: ActiveBus; etaMins: number; timeString: string } => b !== null)
        .sort((a, b) => a.etaMins - b.etaMins)
    : [];

  // Re-adjust selection if the selected bus is no longer running at the selected time
  useEffect(() => {
    if (selectedBusId && !selectedBus) {
      // If the bus finished its journey or time changed, clear selection
      setSelectedBusId(null);
    }
  }, [timeInMins, selectedBusId, selectedBus]);

  // Reset to current physical day and time, and turn on live synchronization
  const handleResetToCurrent = () => {
    setIsLive(true);
    setSelectedBusId(null);
    setSelectedStopId(null);
  };

  const handleSelectBus = (bus: ActiveBus | null) => {
    setSelectedBusId(bus ? bus.busId : null);
    if (bus) {
      setSelectedStopId(null); // Deselect stop when tracking a bus
    }
  };

  const handleSelectStop = (stopId: string | null) => {
    setSelectedStopId(stopId);
    if (stopId) {
      setSelectedBusId(null); // Deselect bus when looking at a stop
    }
  };

  // Convert minutes of day to 12-hour AM/PM format string
  const formatTime12h = (totalMins: number) => {
    const hours24 = Math.floor(totalMins / 60) % 24;
    const mins = Math.floor(totalMins % 60);
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
  };

  // Triggered when clicking a specific scheduled departure in the sidebar
  const handleSelectDepartureTime = (timeStr: string) => {
    const [hStr, mStr] = timeStr.split(":");
    const hours = parseInt(hStr, 10);
    const mins = parseInt(mStr, 10);
    
    setIsLive(false); // Pause live clock
    setTimeInMins(hours * 60 + mins);
    setIsSidebarOpen(false); // Close sidebar to view the map
    
    // Auto-select the newly dispatched bus for that route & departure
    // Find the bus route prefix (e.g. if the user clicked departure "08:30" on expanded BUS A)
    // We can guess the bus ID will be e.g. "BUS A-08:30"
    // Let's delay a fraction to let state update, then find the bus ID
    setTimeout(() => {
      // Find matches
      const predictedId = activeBuses.find((b) => b.tripStartMins === hours * 60 + mins)?.busId;
      if (predictedId) {
        setSelectedBusId(predictedId);
      }
    }, 100);
  };



  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLive(false); // Manually sliding pauses live mode
    setTimeInMins(parseInt(e.target.value, 10));
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLive(false); // Selecting custom day pauses live mode
    setCurrentDay(e.target.value);
  };

  const isDark = theme === "dark";

  return (
    <div className={`relative w-screen h-screen flex flex-col overflow-hidden font-sans transition-colors duration-500 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
      
      {/* 1. HEADER (Permanent full-width header at the top) */}
      <header
        id="app-header"
        className={`w-full h-16 border-b flex-shrink-0 ${
          isDark ? "bg-slate-950/85 text-white border-white/10" : "bg-white/95 text-slate-800 border-slate-900/10"
        } backdrop-blur-md px-6 flex items-center justify-between z-30 transition-all duration-300`}
      >
        {/* Left Side: Brand Logo and Title */}
        <div className="flex items-center gap-3">
          {/* Custom UTM emblem graphic using uploaded logo */}
          <div className="w-10 h-10 rounded-full border border-red-600/30 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center bg-white">
            <img
              src="/src/assets/images/utm_shuttle_logo_1782549105251.jpg"
              alt="UTM Shuttle Logo"
              className="w-full h-full object-cover scale-[1.45] transform origin-center"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className={`font-extrabold text-sm md:text-base leading-none tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              UTM Shuttle Map
            </h1>
            <p className={`text-[10px] font-bold tracking-wide mt-0.5 md:block hidden ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Real-time Map Simulation
            </p>
          </div>
        </div>

        {/* Center Side: Active status badges */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* GPS Real-Route Status Badge */}
          <div className={`${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-900/5 border-slate-900/10 text-slate-700"} px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5`} title="OSRM Real GPS Navigation Path Routing Service">
            <Compass className={`w-3.5 h-3.5 ${routeLoadingState.isDone ? "text-emerald-500" : "text-amber-500 animate-spin"}`} />
            <span className="text-[11px] font-extrabold">
              {routeLoadingState.isDone ? "GPS Roads Active" : `Connecting GPS Roads...`}
            </span>
          </div>

          {/* Quick Shuttle Count Indicator */}
          <div className={`${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-900/5 border-slate-900/10 text-slate-700"} px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5`}>
            <Bus className={`w-3.5 h-3.5 ${isDark ? "text-slate-300" : "text-slate-500"}`} />
            <span className="text-[11px] font-extrabold">{activeBuses.length} Active</span>
          </div>
        </div>

        {/* Right Side: Theme toggler and Sidebar toggle button */}
        <div className="flex items-center gap-2">
          {/* Day/Night Theme Switcher Icon */}
          <button
            id="theme-toggler-btn"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-amber-400 border-white/10"
                : "bg-slate-900/10 hover:bg-slate-900/20 text-indigo-600 border-slate-900/10"
            }`}
            title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sidebar Menu Toggler Button (Rightmost) */}
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                : "bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 border-slate-900/10"
            }`}
            title="Open Schedules Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>



      {/* 3. MAIN MAP WORKSPACE */}
      <main className="flex-1 w-full relative min-h-0 z-0">
        <BusMap
          activeBuses={activeBuses}
          selectedBus={selectedBus}
          onSelectBus={handleSelectBus}
          selectedZone={selectedZone}
          theme={theme}
          selectedRoutes={selectedRoutes}
          selectedStopId={selectedStopId}
          onSelectStop={handleSelectStop}
        />
      </main>

      {/* 4. SELECTED BUS DETAILED INSPECTOR CARD (Floating Bottom Right) */}
      {selectedBus && (
        <div
          id="bus-inspector-card"
          className={`absolute bottom-6 right-4 left-4 md:left-auto md:w-80 ${
            isDark ? "glass-card-dark text-white border-white/10" : "glass-card-light text-slate-800 border-slate-900/10"
          } rounded-3xl overflow-hidden z-25 flex flex-col transition-all duration-300 shadow-2xl border`}
        >
          {/* Card Header with Route Color Banner */}
          <div
            style={{ borderTopColor: selectedBus.color }}
            className={`p-4 border-t-4 ${isDark ? "bg-white/5" : "bg-slate-900/5"} flex items-center justify-between`}
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${selectedBus.color}22` }}
                className="w-8 h-8 rounded-xl border flex items-center justify-center font-black text-sm shadow-inner"
              >
                <span style={{ color: selectedBus.color }}>
                  {selectedBus.routeId.replace("BUS ", "")}
                </span>
              </div>
              <div>
                <h3 className={`font-extrabold text-sm leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                  {selectedBus.routeId}
                </h3>
                <p className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                  Active Dispatch
                </p>
              </div>
            </div>
            
            <button
              id="close-inspector-btn"
              onClick={() => setSelectedBusId(null)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-900/10 text-slate-500 hover:text-slate-950"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status Box */}
          <div className={`px-4 py-3 ${isDark ? "bg-white/5 border-y border-white/10" : "bg-slate-900/5 border-y border-slate-900/10"} flex items-center gap-2`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              {selectedBus.status === "boarding" ? (
                <span>Boarding passengers at <span className={`font-bold ${isDark ? "text-white" : "text-slate-950"}`}>{selectedBus.nextStopName}</span></span>
              ) : (
                <span>Next Stop: <span className={`font-bold ${isDark ? "text-white" : "text-slate-950"}`}>{selectedBus.nextStopName}</span> <span className={`${isDark ? "text-slate-300" : "text-slate-500"}`}>({selectedBus.nextStopEtaMins} mins)</span></span>
              )}
            </p>
          </div>

          {/* ETAs List Scrollable Segment */}
          <div className="p-4 max-h-48 overflow-y-auto space-y-3 custom-scrollbar bg-transparent">
            <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              <MapPin className="w-3.5 h-3.5" />
              ETA to Next Stops
            </p>

            <div className="space-y-2 pl-1.5">
              {selectedBus.allEtas.map((eta, index) => {
                const isNext = index === 0 && selectedBus.status === "travelling";
                return (
                  <div
                    key={`${eta.stopId}-${index}`}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isNext
                        ? isDark
                          ? "bg-white/5 border-white/20 shadow-xs"
                          : "bg-slate-900/5 border-slate-900/20 shadow-xs"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Interactive indicator dot */}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isNext 
                            ? isDark ? "bg-white scale-125" : "bg-slate-900 scale-125" 
                            : isDark ? "bg-white/30" : "bg-slate-900/30"
                        }`}
                      />
                      <span className={`text-xs font-semibold ${
                        isNext 
                          ? isDark ? "text-white font-bold" : "text-slate-900 font-bold" 
                          : isDark ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {eta.stopName}
                      </span>
                    </div>

                    <div className="text-right">
                      {eta.etaMins === 0 ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                          isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-600/10 text-emerald-700"
                        }`}>
                          Arrived
                        </span>
                      ) : (
                        <span className={`text-xs font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                          {eta.etaMins}m <span className={`text-[10px] font-medium font-sans ${isDark ? "text-slate-300" : "text-slate-500"}`}>({eta.timeString})</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Dispatch Info Footer */}
          <div className={`p-3 ${isDark ? "bg-white/5 border-t border-white/10 text-slate-300" : "bg-slate-900/5 border-t border-slate-900/10 text-slate-500"} text-center text-[10px] font-bold`}>
            TRIP STARTED AT {minutesToTimeString(selectedBus.tripStartMins)}
          </div>
        </div>
      )}

      {/* 4.5 SELECTED STOP DETAILED INSPECTOR CARD (Floating Bottom Right) */}
      {selectedStop && (
        <div
          id="stop-inspector-card"
          className={`absolute bottom-6 right-4 left-4 md:left-auto md:w-80 ${
            isDark ? "glass-card-dark text-white border-white/10" : "glass-card-light text-slate-800 border-slate-900/10"
          } rounded-3xl overflow-hidden z-25 flex flex-col transition-all duration-300 shadow-2xl border`}
        >
          {/* Card Header with Stop Banner */}
          <div
            className={`p-4 border-t-4 border-emerald-500 ${isDark ? "bg-white/5" : "bg-slate-900/5"} flex items-center justify-between`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center font-black text-sm shadow-inner"
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className={`font-extrabold text-sm leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                  {selectedStop.name}
                </h3>
                <p className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                  Bus Stop ID: {selectedStop.id}
                </p>
              </div>
            </div>
            
            <button
              id="close-stop-inspector-btn"
              onClick={() => setSelectedStopId(null)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-900/10 text-slate-500 hover:text-slate-950"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status Box */}
          <div className={`px-4 py-3 ${isDark ? "bg-white/5 border-y border-white/10" : "bg-slate-900/5 border-y border-slate-900/10"} flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${upcomingBusesAtStop.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></div>
            <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              {upcomingBusesAtStop.length > 0 ? (
                <span>{upcomingBusesAtStop.length} incoming shuttle{upcomingBusesAtStop.length > 1 ? "s" : ""} scheduled</span>
              ) : (
                <span>No active shuttle dispatches scheduled</span>
              )}
            </p>
          </div>

          {/* Incoming Buses list */}
          <div className="p-4 max-h-48 overflow-y-auto space-y-3 custom-scrollbar bg-transparent font-sans">
            <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              <Bus className="w-3.5 h-3.5" />
              Upcoming Shuttle ETAs
            </p>

            <div className="space-y-2">
              {upcomingBusesAtStop.length === 0 ? (
                <div className={`text-xs py-4 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  No upcoming shuttles currently active.
                </div>
              ) : (
                upcomingBusesAtStop.map(({ bus, etaMins, timeString }) => {
                  return (
                    <button
                      key={bus.busId}
                      onClick={() => handleSelectBus(bus)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isDark 
                          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20" 
                          : "bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10 hover:border-slate-900/20"
                      } cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Bus Route Badge */}
                        <div
                          style={{ backgroundColor: `${bus.color}22`, borderColor: `${bus.color}44` }}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs"
                        >
                          <span style={{ color: bus.color }}>
                            {bus.routeId.replace("BUS ", "")}
                          </span>
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                            {bus.routeId}
                          </p>
                          <p className={`text-[9px] font-bold mt-1 text-slate-400 flex items-center gap-1`}>
                            Next: <span className="font-semibold truncate max-w-[100px]">{bus.nextStopName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        {etaMins === 0 ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                            isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-600/10 text-emerald-700"
                          }`}>
                            Arrived
                          </span>
                        ) : (
                          <span className={`text-xs font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                            {etaMins}m
                          </span>
                        )}
                        <span className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {timeString}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={`p-3 ${isDark ? "bg-white/5 border-t border-white/10 text-slate-400" : "bg-slate-900/5 border-t border-slate-900/10 text-slate-500"} text-center text-[10px] font-bold`}>
            CLICK A SHUTTLE TO TRACK ITS GPS PATH
          </div>
        </div>
      )}

      {/* 5. SIDEBAR SCHEDULE MENU SLIDER */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentDay={currentDay}
        onSelectDepartureTime={handleSelectDepartureTime}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        timeInMins={timeInMins}
        onTimeInMinsChange={(val) => {
          setIsLive(false);
          setTimeInMins(val);
        }}
        onDayChange={(val) => {
          setIsLive(false);
          setCurrentDay(val);
        }}
        isLive={isLive}
        onResetToCurrent={handleResetToCurrent}
        minutesToTimeString={minutesToTimeString}
        selectedRoutes={selectedRoutes}
        onToggleRoute={handleToggleRoute}
        activeBuses={rawActiveBuses}
        theme={theme}
      />
    </div>
  );
}
