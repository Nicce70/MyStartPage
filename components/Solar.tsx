
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { themes } from '../themes';
import { SunIcon, ArrowPathIcon } from './Icons';

interface SolarProps {
  city: string;
  themeClasses: typeof themes.default;
  use24HourFormat?: boolean;
  compactMode?: boolean;
}

interface AstronomyData {
  sunrise: string;
  sunset: string;
  moon_phase: string;
  moon_illumination: string;
}

const Solar: React.FC<SolarProps> = ({ city, themeClasses, use24HourFormat = false, compactMode = false }) => {
  const [astroData, setAstroData] = useState<AstronomyData | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSolarData = useCallback(async () => {
    if (!city) {
      setIsLoading(false);
      setError("Please set a city.");
      setAstroData(null);
      setTimezone(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const cacheKey = `solar-v2-${city.toLowerCase()}`;
    
    // Check cache
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { astro, tz, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 6 * 60 * 60 * 1000) { // Cache for 6 hours
                setAstroData(astro);
                setTimezone(tz);
                setIsLoading(false);
                return;
            }
        }
    } catch (e) {}

    try {
        // 1. Fetch Timezone & Coordinates from Open-Meteo Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }
        
        const location = geoData.results[0];
        const detectedTimezone = location.timezone;
        setTimezone(detectedTimezone);

        // 2. Fetch Astronomy Data from wttr.in
        const wttrRes = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        
        if (!wttrRes.ok) {
            throw new Error("Failed to fetch astro data");
        }

        const weatherData = await wttrRes.json();
        const astro = weatherData.weather?.[0]?.astronomy?.[0];
        
        if (astro) {
            setAstroData(astro);
            // Save to cache
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({ 
                    astro, 
                    tz: detectedTimezone, 
                    timestamp: Date.now() 
                }));
            } catch(e) {}
        } else {
            throw new Error("No astronomy data found");
        }

    } catch (err) {
        // Silently handle error to prevent global app crash messages
        setError("Could not load solar data.");
    } finally {
        setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchSolarData();
  }, [fetchSolarData]);

  // Generate random stars for night mode (memoized to prevent flickering on re-renders)
  const stars = useMemo(() => {
    const starArray = [];
    // Generate 20 random stars
    for(let i=0; i<20; i++) {
        // Spread across full width 0-200, height 0-85
        const x = Math.random() * 200; 
        const y = Math.random() * 85;
        
        // Check distance from center-bottom (100, 90)
        // Allow stars slightly outside the strict arc line (radius 80) for a fuller look, but keep them above horizon
        const dist = Math.sqrt(Math.pow(x - 100, 2) + Math.pow(y - 90, 2));

        if (dist < 95) {
            starArray.push({
                id: i,
                cx: x,
                cy: y,
                r: 0.5 + Math.random() * 0.8, // Smaller stars: 0.5 to 1.3
                delay: Math.random() * 3, // Random animation delay
                duration: 2 + Math.random() * 3 // Random animation speed
            });
        }
    }
    return starArray;
  }, []);

  // Helper to convert "06:42 AM" to minutes from midnight
  const parseTime = (timeStr: string): number => {
      if (!timeStr) return 0;
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
  };

  // Helper to format display time (AM/PM or 24h)
  const formatDisplayTime = (timeStr: string): string => {
      if (!timeStr) return '--:--';
      if (!use24HourFormat) return timeStr;

      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Helper to generate dynamic Moon SVG based on phase name
  const renderDynamicMoon = (phase: string) => {
      const p = phase.toLowerCase();
      let content;

      if (p === 'new moon') {
          // Outline only
          content = <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />;
      } else if (p === 'full moon') {
          // Solid fill
          content = <circle cx="12" cy="12" r="9" fill="currentColor" />;
      } else if (p.includes('waxing') || p.includes('first')) {
          // Right side lit (D shape approx)
          content = (
            <>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M 12 3 A 9 9 0 0 1 12 21 Z" fill="currentColor" />
            </>
          );
      } else if (p.includes('waning') || p.includes('last')) {
          // Left side lit (C shape approx)
          content = (
            <>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M 12 3 A 9 9 0 0 0 12 21 Z" fill="currentColor" />
            </>
          );
      } else {
          // Fallback default moon icon
          content = <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" fill="currentColor" />;
      }

      return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${themeClasses.iconMuted} group-hover:text-white transition-colors`}>
              {content}
          </svg>
      );
  };

  if (isLoading) return <div className={`text-center py-4 text-sm ${themeClasses.textSubtle}`}>Calculating orbit...</div>;
  
  if (error) return (
      <div className="flex flex-col items-center justify-center py-4">
          <div className="text-center text-sm text-red-400 mb-2">{error}</div>
          <button 
            onClick={fetchSolarData}
            className={`p-2 rounded-full ${themeClasses.buttonSecondary} transition-colors hover:brightness-110`}
            title="Retry"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
      </div>
  );
  
  if (!astroData) return null;

  const sunriseMins = parseTime(astroData.sunrise);
  const sunsetMins = parseTime(astroData.sunset);
  
  // Calculate Current Time in Target Timezone
  let currentMins = 0;
  if (timezone) {
      try {
        // Get time string in target timezone
        const targetTimeString = currentTime.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
        const [h, m] = targetTimeString.split(':').map(Number);
        currentMins = h * 60 + m;
      } catch (e) {
        // Fallback to local time if timezone invalid
        currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
      }
  } else {
      // Fallback if no timezone yet
      currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  }
  
  // Calculate day length
  const dayLengthMins = sunsetMins - sunriseMins;
  const dayLengthHours = Math.floor(dayLengthMins / 60);
  const dayLengthMinutesRemaining = dayLengthMins % 60;

  // Calculate Sun Position (0 to 100%)
  let sunPercent = 0;
  let isDaytime = false;

  if (currentMins >= sunriseMins && currentMins <= sunsetMins) {
      isDaytime = true;
      sunPercent = ((currentMins - sunriseMins) / dayLengthMins) * 100;
  } else if (currentMins > sunsetMins) {
      // After sunset
      sunPercent = 100; 
  } else {
      // Before sunrise
      sunPercent = 0;
  }

  const r = 80; // Radius
  const cx = 100; // Center X
  const cy = 90; // Center Y
  const angleRad = (180 - (sunPercent * 1.8)) * (Math.PI / 180); 
  const sunX = cx + r * Math.cos(angleRad);
  const sunY = cy - r * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center p-3">
        <div className={`text-lg font-bold mb-3 ${themeClasses.header}`}>{city}</div>
        
        {!compactMode && (
            <div className="relative w-48 h-24 mb-2 overflow-hidden">
                <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                    <style>{`
                        @keyframes twinkle {
                            0%, 100% { opacity: 0.3; transform: scale(0.8); }
                            50% { opacity: 1; transform: scale(1.2); }
                        }
                    `}</style>

                    {/* Sky/Night Background Area (optional subtle hint) */}
                    {/* Track */}
                    <path 
                        d="M 20 90 A 80 80 0 0 1 180 90" 
                        fill="none" 
                        stroke={themeClasses.dashedBorder.replace('border-', 'rgba(128,128,128,0.3)')} 
                        strokeWidth="4" 
                        strokeDasharray="8 4"
                    />
                    
                    {/* Stars (Night Only) */}
                    {!isDaytime && stars.map(star => (
                        <circle 
                            key={star.id} 
                            cx={star.cx} 
                            cy={star.cy} 
                            r={star.r} 
                            fill="white" 
                            style={{ 
                                transformOrigin: `${star.cx}px ${star.cy}px`,
                                animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s` 
                            }} 
                        />
                    ))}

                    {/* Horizon Line - Two-Tone for visibility */}
                    {/* Bottom solid darker/muted line */}
                    <line x1="10" y1="90" x2="190" y2="90" stroke="currentColor" strokeWidth="3" className="opacity-30" />
                    {/* Top dashed brighter line */}
                    <line x1="10" y1="90" x2="190" y2="90" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" className="opacity-80" />
                    
                    {/* Sun Icon */}
                    {isDaytime && (
                        <foreignObject x={sunX - 14} y={sunY - 14} width="28" height="28">
                            <SunIcon className="w-7 h-7 text-yellow-400 animate-pulse" />
                        </foreignObject>
                    )}
                </svg>
            </div>
        )}

        {/* Sunrise / Sunset Times - Big and Clear */}
        <div className="flex justify-between w-full px-2 mb-4">
            <div className="text-left">
                <div className={`text-xs uppercase font-bold tracking-wider text-orange-300/70 mb-0.5`}>Rise</div>
                <div className={`text-xl font-bold ${themeClasses.modalText}`}>{formatDisplayTime(astroData.sunrise)}</div>
            </div>
            <div className="text-right">
                <div className={`text-xs uppercase font-bold tracking-wider text-purple-300/70 mb-0.5`}>Set</div>
                <div className={`text-xl font-bold ${themeClasses.modalText}`}>{formatDisplayTime(astroData.sunset)}</div>
            </div>
        </div>

        {!compactMode && (
            <>
                <div className={`w-full border-t ${themeClasses.dashedBorder} my-2`}></div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 w-full gap-4 pt-1">
                    <div className="flex flex-col items-center justify-center">
                        <span className={`text-xs uppercase tracking-wider font-semibold ${themeClasses.textSubtle} mb-1`}>Day Length</span>
                        <span className={`text-lg font-bold ${themeClasses.modalText}`}>{dayLengthHours}h {dayLengthMinutesRemaining}m</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center group">
                        <span className={`text-xs uppercase tracking-wider font-semibold ${themeClasses.textSubtle} mb-1`}>Moon</span>
                        <div className="flex items-center gap-2">
                            {renderDynamicMoon(astroData.moon_phase)}
                            <span className={`text-sm font-medium ${themeClasses.modalText} truncate max-w-[90px]`}>{astroData.moon_phase}</span>
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default Solar;
