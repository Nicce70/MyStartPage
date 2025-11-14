import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import type { WeatherData } from '../types';
import { SunIcon } from './Icons';

interface WeatherProps {
  city: string;
  themeClasses: typeof themes.default;
}

const Weather: React.FC<WeatherProps> = ({ city, themeClasses }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) {
      setError('Please set a city in the settings.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setWeatherData(null);

    const cacheKey = `weather-v2-${city.toLowerCase()}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
        try {
            const { data, timestamp } = JSON.parse(cachedData);
            // Cache for 10 minutes
            if (Date.now() - timestamp < 10 * 60 * 1000) {
                setWeatherData(data);
                setIsLoading(false);
                return;
            }
        } catch(e) {
            sessionStorage.removeItem(cacheKey);
        }
    }

    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(response => {
        if (!response.ok) {
          throw new Error('City not found. Check the spelling or try a different format (e.g., "City, Country Code").');
        }
        return response.json();
      })
      .then(data => {
        if (!data.current_condition || !data.weather) {
            throw new Error('Invalid weather data received.');
        }
        setWeatherData(data);
        const cachePayload = { data, timestamp: Date.now() };
        sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [city]);

  if (isLoading) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Loading weather...</div>;
  }

  if (error) {
    return <div className={`text-sm text-center py-4 text-red-400`}>{error}</div>;
  }
  
  if (!weatherData) {
    return null;
  }

  const { current_condition, nearest_area, weather } = weatherData;
  const currentCondition = current_condition[0];
  const forecast = weather[0];
  const area = nearest_area[0];

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <h3 className={`text-lg font-bold ${themeClasses.header}`}>{area.areaName[0].value}</h3>
      <div className="flex items-center gap-2 my-1">
        {currentCondition.weatherIconUrl?.[0]?.value ? (
            <img 
                src={currentCondition.weatherIconUrl[0].value} 
                alt={currentCondition.weatherDesc[0].value}
                className="w-12 h-12"
            />
        ) : (
            <SunIcon className={`w-12 h-12 ${themeClasses.iconMuted}`} />
        )}
        <p className="text-3xl font-bold">{currentCondition.temp_C}°C</p>
      </div>
      <p className={`capitalize text-sm ${themeClasses.textMuted}`}>{currentCondition.weatherDesc[0].value}</p>
      <p className={`text-xs ${themeClasses.textSubtle}`}>
        H: {forecast.maxtempC}° L: {forecast.mintempC}°
      </p>
    </div>
  );
};

export default Weather;