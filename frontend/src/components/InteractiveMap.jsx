import { useState, useRef, useMemo, useEffect } from 'react'
import {
  CITIES,
  COUNTRY_POLYGONS,
  project,
  calculateRoadDistance,
  POPULAR_ROUTES,
  findCityByName,
} from '../utils/geoData'
import {
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  MapPin,
  Car,
  Compass,
  ArrowRight,
  Route,
} from 'lucide-react'

export default function InteractiveMap({
  originCity,
  destinationCity,
  onSelectOrigin,
  onSelectDestination,
  onQuickRouteSelect,
  calculatedDistance,
}) {
  const svgRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredCity, setHoveredCity] = useState(null)
  const [activeTooltip, setActiveTooltip] = useState(null)

  // Find city objects matching origin and destination
  const originObj = useMemo(() => findCityByName(originCity), [originCity])
  const destObj = useMemo(() => findCityByName(destinationCity), [destinationCity])

  // Project country polygons into SVG path strings
  const renderedCountries = useMemo(() => {
    return COUNTRY_POLYGONS.map((country) => {
      const pathD =
        country.points
          .map((pt, i) => {
            const { x, y } = project(pt[0], pt[1])
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
          })
          .join(' ') + ' Z'

      // Calculate approximate centroid for country label
      let avgX = 0
      let avgY = 0
      country.points.forEach((pt) => {
        const { x, y } = project(pt[0], pt[1])
        avgX += x
        avgY += y
      })
      avgX /= country.points.length
      avgY /= country.points.length

      return {
        ...country,
        pathD,
        centroid: { x: avgX, y: avgY },
      }
    })
  }, [])

  // City projected coordinates
  const projectedCities = useMemo(() => {
    return CITIES.map((city) => {
      const { x, y } = project(city.lat, city.lng)
      const isOrigin = originObj && originObj.id === city.id
      const isDestination = destObj && destObj.id === city.id
      return {
        ...city,
        x,
        y,
        isOrigin,
        isDestination,
        isSelected: isOrigin || isDestination,
      }
    })
  }, [originObj, destObj])

  // Calculate curved trajectory between Origin and Destination
  const routePath = useMemo(() => {
    if (!originObj || !destObj || originObj.id === destObj.id) return null

    const p1 = project(originObj.lat, originObj.lng)
    const p2 = project(destObj.lat, destObj.lng)

    // Midpoint
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2

    // Normal vector perpendicular to the line for quadratic curve
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    
    // Curvature height proportional to distance
    const curvature = Math.min(len * 0.18, 55)
    // Curve upwards/northwards
    const nx = -dy / (len || 1)
    const ny = dx / (len || 1)

    // Control point
    const ctrlX = midX + nx * curvature
    const ctrlY = midY + ny * curvature

    const pathD = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`

    // Label anchor at curve midpoint
    const labelX = 0.25 * p1.x + 0.5 * ctrlX + 0.25 * p2.x
    const labelY = 0.25 * p1.y + 0.5 * ctrlY + 0.25 * p2.y

    return {
      p1,
      p2,
      pathD,
      labelX,
      labelY,
      distanceKm: calculatedDistance || calculateRoadDistance(originObj.name, destObj.name),
    }
  }, [originObj, destObj, calculatedDistance])

  // Pan and Zoom handlers
  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.75), 3.5)
      return newZoom
    })
  }

  const handleMouseDown = (e) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Handle city click
  const handleCityClick = (city, e) => {
    e.stopPropagation()

    // If no origin set, set origin
    if (!originCity) {
      onSelectOrigin(city.name)
      setActiveTooltip(null)
      return
    }

    // If origin is set, but no destination, set destination
    if (originCity && !destinationCity) {
      if (city.name.toLowerCase() === originCity.toLowerCase()) {
        // Deselect if clicking origin again
        onSelectOrigin('')
      } else {
        onSelectDestination(city.name)
      }
      setActiveTooltip(null)
      return
    }

    // If both are set:
    if (city.name.toLowerCase() === originCity.toLowerCase()) {
      onSelectOrigin('')
    } else if (city.name.toLowerCase() === destinationCity.toLowerCase()) {
      onSelectDestination('')
    } else {
      // Show interactive action modal/tooltip for city
      setActiveTooltip({
        city,
        x: city.x,
        y: city.y,
      })
    }
  }

  // Close tooltip when clicking background
  const handleBgClick = () => {
    setActiveTooltip(null)
  }

  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-[680px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Background ambient glow effect */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Quick Route Presets */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Status / Instruction Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs shadow-lg text-slate-300">
          <Compass className="w-4 h-4 text-primary-400 animate-spin-slow" />
          <span>
            {!originCity ? (
              <strong className="text-emerald-400">Step 1: Click map to select Start city</strong>
            ) : !destinationCity ? (
              <strong className="text-indigo-400">Step 2: Click map to select Destination</strong>
            ) : (
              <span className="text-emerald-300 font-medium">
                Route Active: <span className="text-white">{originCity}</span> → <span className="text-white">{destinationCity}</span>
              </span>
            )}
          </span>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Popular:
          </span>
          {POPULAR_ROUTES.map((route, i) => (
            <button
              key={i}
              onClick={() => onQuickRouteSelect(route.origin, route.destination)}
              className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-primary-600/30 hover:border-primary-500/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all whitespace-nowrap shadow-sm"
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Pan & Zoom Controls Overlay */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.25, 3.5))}
          title="Zoom In"
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-lg transition-all backdrop-blur-md"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.75))}
          title="Zoom Out"
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-lg transition-all backdrop-blur-md"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset View"
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 shadow-lg transition-all backdrop-blur-md"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-5 left-5 z-20 hidden sm:flex items-center gap-4 px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
          <span>Start (Origin)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 animate-pulse" />
          <span>Finish (Destination)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 ring-2 ring-slate-600" />
          <span>City node</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleBgClick}
      >
        <defs>
          {/* Linear gradient for connecting route line */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Glow filter for route line */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Pulse marker animations */}
          <style>{`
            @keyframes dashFlow {
              to {
                stroke-dashoffset: -40;
              }
            }
            .animated-route-line {
              stroke-dasharray: 8 6;
              animation: dashFlow 1.6s linear infinite;
            }
          `}</style>
        </defs>

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '500px 350px', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
        >
          {/* Subtle Latitude/Longitude Grid Lines */}
          <g opacity="0.12" stroke="#94a3b8" strokeDasharray="3 4">
            {[10, 15, 20, 25, 30].map((lng) => {
              const { x } = project(50, lng)
              return <line key={`lng-${lng}`} x1={x} y1="0" x2={x} y2="700" />
            })}
            {[48, 50, 52, 54, 56].map((lat) => {
              const { y } = project(lat, 20)
              return <line key={`lat-${lat}`} x1="0" y1={y} x2="1000" y2={y} />
            })}
          </g>

          {/* Country Polygons */}
          <g className="countries">
            {renderedCountries.map((country) => {
              const isPoland = country.code === 'PL'
              return (
                <g key={country.code} className="transition-colors group">
                  <path
                    d={country.pathD}
                    className={`transition-all duration-300 ${
                      isPoland
                        ? 'fill-slate-800/80 stroke-primary-500/40 hover:fill-slate-800'
                        : 'fill-slate-900/60 stroke-slate-700/40 hover:fill-slate-800/50'
                    }`}
                    strokeWidth={isPoland ? '1.8' : '1.2'}
                    strokeLinejoin="round"
                  />
                  {/* Country Name Text Label */}
                  <text
                    x={country.centroid.x}
                    y={country.centroid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-extrabold tracking-widest uppercase pointer-events-none select-none ${
                      isPoland
                        ? 'text-[13px] fill-primary-400/40 font-mono tracking-[0.25em]'
                        : 'text-[11px] fill-slate-600/40 font-mono'
                    }`}
                  >
                    {country.name}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Connecting Route Arc (when both origin and destination are set) */}
          {routePath && (
            <g className="route-layer">
              {/* Outer soft glow line */}
              <path
                d={routePath.pathD}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.25"
                filter="url(#glow)"
              />

              {/* Solid base line */}
              <path
                d={routePath.pathD}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Animated dashed light stream */}
              <path
                d={routePath.pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animated-route-line"
              />

              {/* Route distance indicator badge floating at curve midpoint */}
              <g transform={`translate(${routePath.labelX}, ${routePath.labelY})`}>
                <rect
                  x="-55"
                  y="-18"
                  width="110"
                  height="36"
                  rx="18"
                  fill="#090d16"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="shadow-xl"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  className="select-none font-sans"
                >
                  🚗 {routePath.distanceKm} km
                </text>
              </g>
            </g>
          )}

          {/* Cities layer */}
          <g className="cities-layer">
            {projectedCities.map((city) => {
              const isHovered = hoveredCity && hoveredCity.id === city.id
              const isOrigin = city.isOrigin
              const isDestination = city.isDestination

              return (
                <g
                  key={city.id}
                  transform={`translate(${city.x}, ${city.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => handleCityClick(city, e)}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Start City (Origin) Glowing Radar Marker */}
                  {isOrigin && (
                    <g>
                      <circle r="22" fill="#10b981" opacity="0.2" className="animate-ping" />
                      <circle r="14" fill="#10b981" opacity="0.3" />
                      <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                      {/* Origin Badge */}
                      <g transform="translate(0, -22)">
                        <rect
                          x="-28"
                          y="-10"
                          width="56"
                          height="20"
                          rx="6"
                          fill="#059669"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          START (A)
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Destination City Glowing Radar Marker */}
                  {isDestination && (
                    <g>
                      <circle r="22" fill="#6366f1" opacity="0.2" className="animate-ping" />
                      <circle r="14" fill="#6366f1" opacity="0.3" />
                      <circle r="8" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
                      {/* Destination Badge */}
                      <g transform="translate(0, -22)">
                        <rect
                          x="-32"
                          y="-10"
                          width="64"
                          height="20"
                          rx="6"
                          fill="#4f46e5"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          FINISH (B)
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Normal City Pin */}
                  {!isOrigin && !isDestination && (
                    <g>
                      {/* Hover background halo */}
                      {isHovered && (
                        <circle r="16" fill="#38bdf8" opacity="0.25" className="animate-pulse" />
                      )}
                      {/* Main Node */}
                      <circle
                        r={city.isCapital ? '5.5' : '4'}
                        fill={isHovered ? '#38bdf8' : city.isCapital ? '#f8fafc' : '#94a3b8'}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        className="transition-colors duration-200"
                      />
                      {city.isCapital && (
                        <circle r="2" fill="#0284c7" />
                      )}
                    </g>
                  )}

                  {/* City Label Text */}
                  <text
                    x="0"
                    y={isOrigin || isDestination ? 20 : isHovered ? -10 : 14}
                    textAnchor="middle"
                    className={`select-none transition-all duration-200 font-medium ${
                      isOrigin
                        ? 'fill-emerald-300 font-bold text-[12px]'
                        : isDestination
                        ? 'fill-indigo-300 font-bold text-[12px]'
                        : isHovered
                        ? 'fill-white font-bold text-[12px]'
                        : city.tier === 1
                        ? 'fill-slate-300 text-[10px]'
                        : 'fill-slate-400 text-[9px]'
                    }`}
                    style={{
                      textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.8)',
                    }}
                  >
                    {city.name}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Interactive Popover Tooltip (for quick setting Start/Finish when both are occupied) */}
          {activeTooltip && (
            <g
              transform={`translate(${activeTooltip.x}, ${activeTooltip.y - 45})`}
              className="z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <rect
                x="-80"
                y="-25"
                width="160"
                height="50"
                rx="10"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.5"
                filter="drop-shadow(0 10px 15px rgba(0,0,0,0.6))"
              />
              <text
                x="0"
                y="-8"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                {activeTooltip.city.name} ({activeTooltip.city.country})
              </text>
              <g transform="translate(-70, 4)">
                {/* Button: Set as Start */}
                <rect
                  x="0"
                  y="0"
                  width="65"
                  height="16"
                  rx="4"
                  fill="#059669"
                  className="cursor-pointer hover:fill-emerald-500"
                  onClick={() => {
                    onSelectOrigin(activeTooltip.city.name)
                    setActiveTooltip(null)
                  }}
                />
                <text
                  x="32.5"
                  y="11"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  className="cursor-pointer pointer-events-none"
                >
                  Set as Start
                </text>
              </g>
              <g transform="translate(5, 4)">
                {/* Button: Set as Finish */}
                <rect
                  x="0"
                  y="0"
                  width="65"
                  height="16"
                  rx="4"
                  fill="#4f46e5"
                  className="cursor-pointer hover:fill-indigo-500"
                  onClick={() => {
                    onSelectDestination(activeTooltip.city.name)
                    setActiveTooltip(null)
                  }}
                />
                <text
                  x="32.5"
                  y="11"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  className="cursor-pointer pointer-events-none"
                >
                  Set as Finish
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
