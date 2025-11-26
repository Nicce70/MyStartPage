
import React, { useState, useEffect, useCallback } from 'react';
import type { themes } from '../themes';
import type { WeatherData } from '../types';
import { ArrowPathIcon } from './Icons';

interface WeatherProps {
  city: string;
  themeClasses: typeof themes.default;
  showForecast?: boolean;
  showTime?: boolean;
  timezone?: string;
}

// WMO Weather Codes mapping
const getWeatherDescription = (code: number): string => {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56: return 'Light freezing drizzle';
    case 57: return 'Dense freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66: return 'Light freezing rain';
    case 67: return 'Heavy freezing rain';
    case 71: return 'Slight snow fall';
    case 73: return 'Moderate snow fall';
    case 75: return 'Heavy snow fall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return 'Unknown';
  }
};

const getWeatherIcon = (code: number, isDay: boolean = true): string => {
  switch (code) {
    case 0: return isDay ? '☀️' : '🌙';
    case 1: return isDay ? '🌤️' : '🌙';
    case 2: return '⛅';
    case 3: return '☁️';
    case 45: 
    case 48: return '🌫️';
    case 51: 
    case 53: 
    case 55: return '🌦️';
    case 56: 
    case 57: return '🌧️'; // Freezing drizzle
    case 61: 
    case 63: 
    case 65: return '🌧️'; // Rain
    case 66: 
    case 67: return '❄️'; // Freezing rain
    case 71: 
    case 73: 
    case 75: 
    case 77: return '❄️'; // Snow
    case 80: 
    case 81: 
    case 82: return '🌦️'; // Rain showers
    case 85: 
    case 86: return '❄️'; // Snow showers
    case 95: 
    case 96: 
    case 99: return '⛈️'; // Thunderstorm
    default: return '🌡️';
  }
};

const Weather: React.FC<WeatherProps> = ({ city, themeClasses, showForecast, showTime, timezone }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    if (showTime) {
      const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timerId);
    }
  }, [showTime]);

  const fetchWeatherData = useCallback(async () => {
    if (!city) {
      setIsLoading(false);
      setWeatherData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const cacheKey = `weather-om-${city.toLowerCase()}`;

    // Check Cache
    try {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 30 * 60 * 1000) { // Cache for 30 mins
            setWeatherData(data);
            setIsLoading(false);
            return;
        }
      }
    } catch(e) {}

    try {
      // 1. Geocoding
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (!geoRes.ok) throw new Error('Geocoding failed');
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found.');
      }

      const { latitude, longitude, name, country_code } = geoData.results[0];
      const locationName = `${name}, ${country_code}`;

      // 2. Weather Forecast
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
      if (!weatherRes.ok) throw new Error('Weather data unavailable');
      const data = await weatherRes.json();

      const transformedData: WeatherData = {
        locationName,
        current: {
          temp: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          description: getWeatherDescription(data.current.weather_code),
          isDay: !!data.current.is_day
        },
        daily: data.daily.time.map((date: string, index: number) => ({
          date,
          maxTemp: Math.round(data.daily.temperature_2m_max[index]),
          minTemp: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weather_code[index],
          description: getWeatherDescription(data.daily.weather_code[index])
        }))
      };

      setWeatherData(transformedData);
      
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: transformedData, timestamp: Date.now() }));
      } catch(e) {}

    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

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

  if (isLoading && !weatherData) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Loading weather...</div>;
  }

  if (error && !weatherData) {
    return (
      <div className={`flex flex-col items-center justify-center py-4`}>
        <div className={`text-sm text-center text-red-400 mb-2`}>{error}</div>
        <button 
            onClick={fetchWeatherData}
            className={`p-2 rounded-full ${themeClasses.buttonSecondary} transition-colors hover:brightness-110`}
            title="Retry"
        >
            <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  if (!weatherData) return null;

  const { current, daily, locationName } = weatherData;
  const todayForecast = daily[0];

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    // Reset times for accurate comparison
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check for Tomorrow
    const tomorrow = new Date(t);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      {showTime && (
        <div className={`text-xl font-bold ${themeClasses.header} mb-1 font-mono`}>
            {formatTime()}
        </div>
      )}
      <h3 className={`text-lg font-bold ${themeClasses.header}`}>{locationName}</h3>
      <div className="flex items-center gap-2 my-1">
        <div className="text-4xl leading-none" title={current.description}>
          {getWeatherIcon(current.weatherCode, current.isDay)}
        </div>
        <p className="text-3xl font-bold">{current.temp}°C</p>
      </div>
      <p className={`capitalize text-sm ${themeClasses.textMuted}`}>{current.description}</p>
      <p className={`text-sm ${themeClasses.textMuted}`}>
        H: {todayForecast.maxTemp}° L: {todayForecast.minTemp}°
      </p>

      {showForecast && daily.length > 2 && (
        <div className={`mt-4 pt-3 border-t w-full grid grid-cols-2 gap-2 ${themeClasses.dashedBorder}`}>
            {daily.slice(1, 3).map((day) => (
              <div key={day.date} className="flex flex-col items-center">
                  <p className="font-bold text-sm">{getDayName(day.date)}</p>
                  <div className="text-2xl my-1" title={day.description}>
                    {getWeatherIcon(day.weatherCode)}
                  </div>
                  <p className={`capitalize text-xs ${themeClasses.textSubtle}`}>{day.description}</p>
                  <p className={`font-medium text-base ${themeClasses.textMuted}`}>
                    H: {day.maxTemp}° L: {day.minTemp}°
                  </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Weather;
