import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import type { WeatherData } from '../types';
import { SunIcon } from './Icons';

interface WeatherProps {
  city: string;
  themeClasses: typeof themes.default;
  showForecast?: boolean;
  showTime?: boolean;
  timezone?: string;
}

const Weather: React.FC<WeatherProps> = ({ city, themeClasses, showForecast, showTime, timezone }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 🔧 Emoji fallback icon mapping
  const getFallbackIcon = (desc: string): string => {
    const lower = desc.toLowerCase();
    if (lower.includes("sun") || lower.includes("clear")) return "☀️";
    if (lower.includes("cloud")) return "☁️";
    if (lower.includes("rain")) return "🌧️";
    if (lower.includes("snow")) return "❄️";
    return "🌦️";
  };

  useEffect(() => {
    if (showTime) {
      const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timerId);
    }
  }, [showTime]);

  useEffect(() => {
    if (!city) {
      setIsLoading(false);
      setWeatherData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setWeatherData(null);

    const cacheKey = `weather-v2-${city.toLowerCase()}`;
    try {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 10 * 60 * 1000) {
            setWeatherData(data);
            setIsLoading(false);
            return;
        }
      }
    } catch(e) {
        sessionStorage.removeItem(cacheKey);
    }

    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(response => {
        if (!response.ok) {
          throw new Error('City not found. Check spelling or try "City, Country".');
        }
        return response.json();
      })
      .then(data => {
        setWeatherData(data);
        const cachePayload = { data, timestamp: Date.now() };
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch(e) {
          console.error("Could not write to session storage", e);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [city]);
  
  const secureUrl = (url: string) => {
    if (url && url.startsWith('http:')) {
      return url.replace('http:', 'https://');
    }
    return url;
  };

  const formatTime = () => {
    if (!timezone) return '--:--';
    try {
      return currentTime.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (e) {
      return 'Invalid TZ';
    }
  };

  if (!city) {
    return <div className={`text-sm text-center py-4 text-red-400`}>Please set a city in the settings.</div>;
  }

  if (isLoading) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Loading weather...</div>;
  }

  if (error) {
    return <div className={`text-sm text-center py-4 text-red-400`}>{error}</div>;
  }
  
  if (!weatherData || !weatherData.current_condition?.[0] || !weatherData.nearest_area?.[0] || !weatherData.weather?.[0]) {
    return <div className={`text-sm text-center py-4 text-red-400`}>Weather data is unavailable.</div>;
  }

  const { current_condition, nearest_area, weather } = weatherData;
  const currentCondition = current_condition[0];
  const todayForecast = weather[0];
  const area = nearest_area[0];

  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return "Tomorrow";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      {showTime && (
        <div className={`text-xl font-bold ${themeClasses.header} mb-1 font-mono`}>
            {formatTime()}
        </div>
      )}
      <h3 className={`text-lg font-bold ${themeClasses.header}`}>{area.areaName?.[0]?.value || city}</h3>
      <div className="flex items-center gap-2 my-1">
        {currentCondition.weatherIconUrl?.[0]?.value ? (
            <img 
                src={secureUrl(currentCondition.weatherIconUrl[0].value)} 
                alt={currentCondition.weatherDesc?.[0]?.value || 'Weather icon'}
                className="w-12 h-12"
            />
        ) : (
            <SunIcon className={`w-12 h-12 ${themeClasses.iconMuted}`} />
        )}
        <p className="text-3xl font-bold">{currentCondition.temp_C}°C</p>
      </div>
      <p className={`capitalize text-sm ${themeClasses.textMuted}`}>{currentCondition.weatherDesc?.[0]?.value || 'N/A'}</p>
      <p className={`text-sm ${themeClasses.textMuted}`}>
        H: {todayForecast.maxtempC}° L: {todayForecast.mintempC}°
      </p>

      {showForecast && weather.length > 2 && (
        <div className={`mt-4 pt-3 border-t w-full grid grid-cols-2 gap-2 ${themeClasses.dashedBorder}`}>
            {weather.slice(1, 3).map((day, index) => {
              const hourlyData = day.hourly?.[4];
              const forecastIconUrl = hourlyData?.weatherIconUrl?.[0]?.value;
              const forecastDesc = hourlyData?.weatherDesc?.[0]?.value || 'N/A';

              return (
                <div key={day.date} className="flex flex-col items-center">
                    <p className="font-bold text-sm">{getDayName(day.date, index)}</p>

                    {forecastIconUrl ? (
                      <img
                        src={secureUrl(forecastIconUrl)}
                        alt={forecastDesc}
                        className="w-8 h-8 my-1"
                      />
                    ) : (
                      <div className="text-2xl my-1">{getFallbackIcon(forecastDesc)}</div>
                    )}

                    <p className={`capitalize text-xs ${themeClasses.textSubtle}`}>{forecastDesc}</p>
                    <p className={`font-medium text-base ${themeClasses.textMuted}`}>
                      H: {day.maxtempC}° L: {day.mintempC}°
                    </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Weather;
