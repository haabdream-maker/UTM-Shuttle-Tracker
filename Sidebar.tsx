import { useState, useEffect } from "react";
import { X, Bus, MapPin, Clock, Calendar, Compass, ListFilter, Sliders, RotateCcw } from "lucide-react";
import { ROUTES, STOPS, getFullSchedules, ZONES, RouteScheduleItem, DAYS, ActiveBus, Stop } from "../data";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: string;
  onSelectDepartureTime: (timeStr: string) => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  timeInMins: number;
  onTimeInMinsChange: (mins: number) => void;
  onDayChange: (day: string) => void;
  isLive: boolean;
  onResetToCurrent: () => void;
  minutesToTimeString: (mins: number) => string;
  selectedRoutes: string[];
  onToggleRoute: (routeId: string) => void;
  activeBuses: ActiveBus[];
  theme: "light" | "dark";
}

export default function Sidebar({
  isOpen,
  onClose,
  currentDay,
  onSelectDepartureTime,
  selectedZone,
  onSelectZone,
  timeInMins,
  onTimeInMinsChange,
  onDayChange,
  isLive,
  onResetToCurrent,
  minutesToTimeString,
  selectedRoutes,
  onToggleRoute,
  activeBuses,
  theme,
}: SidebarProps) {
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const schedules = getFullSchedules(currentDay);

  // Show the whole menu (filter only by search, ignoring zone as requested)
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.routeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.stops.some((stop) =>
        stop.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  const toggleRouteExpand = (routeId: string) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  // Safe global mouse/touch release listener when sliding the time picker
  useEffect(() => {
    if (isDraggingSlider) {
      const handleGlobalRelease = () => {
        setIsDraggingSlider(false);
      };
      window.addEventListener("mouseup", handleGlobalRelease);
      window.addEventListener("touchend", handleGlobalRelease);
      return () => {
        window.removeEventListener("mouseup", handleGlobalRelease);
        window.removeEventListener("touchend", handleGlobalRelease);
      };
    }
  }, [isDraggingSlider]);

  return (
    <>
      {/* Sidebar Overlay (Map remains sharp and unblurred) */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-slate-950/15 z-40 transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Main Frame on the Right Side (Starts below the header) */}
      <div
        id="sidebar-container"
        className={`fixed top-16 bottom-0 right-0 w-[310px] z-50 transform transition-all duration-300 ease-out flex flex-col text-white ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${
          isDraggingSlider 
            ? "bg-slate-950/20 border-l border-white/5 shadow-none" 
            : "glass-card-dark border-l border-white/10 shadow-2xl"
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-5 border-b border-white/10 flex items-center justify-between bg-white/5 transition-all duration-200 ${
          isDraggingSlider ? "hidden opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">UTM Shuttle Map</h2>
              <p className="text-[11px] text-slate-300 font-medium">Active Day: {currentDay}</p>
            </div>
          </div>
          <button
            id="close-sidebar-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition-colors shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Live Clock & Reset HUD inside Sidebar */}
        <div className={`p-4 bg-slate-950/20 border-b border-white/10 flex items-center justify-between gap-4 transition-all duration-200 ${
          isDraggingSlider ? "hidden opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 ${isLive ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider">
                {isLive ? "Live GPS Clock" : "Simulated GPS Clock"}
              </span>
              <span className="text-sm font-extrabold font-mono text-white mt-0.5">
                {minutesToTimeString(timeInMins)} ({currentDay})
              </span>
            </div>
          </div>
          
          <button
            onClick={onResetToCurrent}
            disabled={isLive}
            className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center justify-center cursor-pointer ${
              isLive
                ? "bg-white/5 text-slate-500 border-white/5 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20 text-white border-white/25 hover:scale-105 active:scale-95"
            }`}
            title="Reset to live current time"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters and Search Container */}
        <div className={`p-4 bg-white/5 border-b border-white/10 flex flex-col gap-3 transition-all duration-200 ${
          isDraggingSlider ? "hidden opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          {/* Route Search Input */}
          <div className="relative">
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search by bus, stop or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all duration-200 text-white focus:bg-slate-900/80 focus:border-white/20 shadow-sm placeholder:text-slate-400"
            />
            <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Time Simulation Picker Section (Becomes floating card on top of map when dragging) */}
        <div className={`p-4 transition-all duration-300 ${
          isDraggingSlider 
            ? "bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl mx-2 my-2" 
            : "bg-white/5 border-b border-white/10"
        }`}>
          <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Time & Day Picker
          </h5>
          
          {/* Day Selector & Time Display Label */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <div className="relative flex-1">
                <select
                  id="time-panel-day-select"
                  value={currentDay}
                  onChange={(e) => onDayChange(e.target.value)}
                  className="w-full bg-slate-900/50 hover:bg-slate-900/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer transition-all appearance-none pr-7 shadow-sm"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day} className="text-slate-900 bg-white font-semibold">
                      {day === "Wen" ? "Wed" : day}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-extrabold text-white bg-white/15 px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                {minutesToTimeString(timeInMins)}
              </span>
            </div>
          </div>

          {/* Time Picker Range Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">00:00</span>
            <input
              id="time-picker-slider"
              type="range"
              min="0"
              max="1439"
              step="5"
              value={timeInMins}
              onChange={(e) => onTimeInMinsChange(Number(e.target.value))}
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onTouchStart={() => setIsDraggingSlider(true)}
              onTouchEnd={() => setIsDraggingSlider(false)}
              className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span className="text-[10px] font-mono text-slate-400">23:59</span>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isLive ? "Live Clock Active" : "Simulated Time"}
            </span>
            {!isLive && (
              <button
                onClick={onResetToCurrent}
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors underline decoration-dotted cursor-pointer"
              >
                Resume Live Clock
              </button>
            )}
          </div>
        </div>

        {/* Schedules Scrollable List */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-transparent transition-all duration-200 ${
          isDraggingSlider ? "hidden opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white/5 rounded-full text-slate-300">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">No matching routes</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
              </div>
            </div>
          ) : (
            filteredSchedules.map((schedule) => {
              const isExpanded = expandedRouteId === schedule.routeId;
              const busLetter = schedule.routeId.replace("BUS ", "");
              const isCurrentlyOperating = activeBuses.some((b) => b.routeId === schedule.routeId);
              const isChecked = selectedRoutes.includes(schedule.routeId);

              return (
                <div
                  key={schedule.routeId}
                  className={`border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                    isExpanded 
                      ? "border-white/25 shadow-md ring-1 ring-white/10" 
                      : "border-white/10"
                  } ${
                    isCurrentlyOperating 
                      ? "bg-white/5 hover:bg-white/10" 
                      : "bg-slate-950/20 opacity-55 saturate-50 hover:opacity-85 hover:bg-slate-950/30"
                  }`}
                >
                  {/* Route Header (Clickable Accordion Trigger) */}
                  <div
                    onClick={() => toggleRouteExpand(schedule.routeId)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox for Route Visibility */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRoute(schedule.routeId);
                        }}
                        className="p-1 -ml-1 mr-0.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                        title={isChecked ? "Hide this route from map" : "Show this route on map"}
                      >
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked 
                            ? "bg-emerald-500 border-emerald-400 text-white" 
                            : "border-white/35 text-transparent hover:border-white/60"
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </button>

                      {/* Glass Route ID Icon */}
                      <div
                        style={{
                          backgroundColor: `${schedule.color}22`,
                          borderColor: schedule.color,
                        }}
                        className="w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm shadow-inner shadow-white/40 flex-shrink-0"
                      >
                        <span style={{ color: schedule.color }}>{busLetter}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-white text-sm">{schedule.routeId}</h4>
                          {isCurrentlyOperating ? (
                            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-900/40 border border-white/5 px-1 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-semibold leading-none mt-0.5">
                          {schedule.stops[0].id} ➔ {schedule.stops[schedule.stops.length - 1].id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-[10px] font-semibold text-slate-200 bg-white/10 rounded-md px-1.5 py-0.5">
                        {schedule.departures.length} trips
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-white" : ""
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Route Details Container */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-[1000px] opacity-100 border-t border-white/10" : "max-h-0 opacity-0 pointer-events-none"
                    } overflow-hidden`}
                  >
                    <div className="p-4 bg-white/5 space-y-4">
                      {/* Description */}
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {schedule.description}
                      </p>

                      {/* Stops list timeline */}
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-2.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          Stops Timeline
                        </h5>
                        <div className="pl-2 space-y-0.5">
                          {schedule.stops.map((stop, i) => {
                            const isFirst = i === 0;
                            const isLast = i === schedule.stops.length - 1;
                            return (
                              <div key={`${stop.id}-${i}`} className="flex gap-3 items-start relative pb-3 last:pb-1">
                                {/* Timeline line */}
                                {!isLast && (
                                  <div className="absolute left-[5.5px] top-4 bottom-0 w-0.5 bg-white/10"></div>
                                )}
                                
                                {/* Bullet indicator */}
                                <div className="mt-1 relative flex items-center justify-center">
                                  {isFirst || isLast ? (
                                    <div
                                      style={{ backgroundColor: schedule.color }}
                                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm ring-1 ring-white/10"
                                    >
                                      <div className="w-1 h-1 rounded-full bg-white"></div>
                                    </div>
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white/20 flex items-center justify-center">
                                      <div className="w-1 h-1 rounded-full bg-white/60"></div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 flex justify-between items-center">
                                  <span className="text-xs font-semibold text-white">{stop.name}</span>
                                  <span className="text-[10px] font-mono text-slate-300 font-bold bg-white/10 rounded px-1">{stop.id}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Schedule Departures list */}
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-2.5">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          Departure Schedule
                        </h5>
                        <div className="grid grid-cols-4 gap-1.5">
                          {schedule.departures.map((time) => (
                            <button
                              key={time}
                              onClick={() => onSelectDepartureTime(time)}
                              className="px-1.5 py-1 text-[11px] font-mono font-bold bg-white/10 hover:bg-white border border-white/10 rounded-lg hover:text-slate-950 hover:border-white transition-all shadow-xs flex items-center justify-center gap-0.5 group cursor-pointer"
                              title="Click to simulate this trip"
                            >
                              <span>{time}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-2 text-right">
                          * Click a badge to simulate departure
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>


      </div>
    </>
  );
}
