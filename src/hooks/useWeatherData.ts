
import { useState, useEffect } from "react";
import { computeSunriseSunset, utcToLocalTime } from "@/lib/solarCalculations";

// Types
export interface ForecastDay {
  date: string;
  temperature: number;
  condition: string;
}

export interface HourlyPrecipitation {
  hour: string;
  value: number;
}

export interface TemperatureComparison {
  yesterday: number;
  today: number;
  difference: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
  forecast?: ForecastDay[];
  hourlyPrecipitation?: HourlyPrecipitation[];
  tempComparison?: TemperatureComparison;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  dayDuration?: string;
  humidity?: number;
}

export const useWeatherData = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get location from settings instead of using geolocation API
        const settingsData = localStorage.getItem("gardenSettings");
        let latitude = 45.882550; // Default coordinates if settings not found
        let longitude = 2.905965;
        
        if (settingsData) {
          try {
            const settings = JSON.parse(settingsData);
            if (settings.location) {
              const [lat, lon] = settings.location.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lon)) {
                latitude = lat;
                longitude = lon;
              }
            }
          } catch (parseError) {
            console.error('Error parsing settings:', parseError);
          }
        }
        
        // Call the Supabase Edge Function for weather data
        const response = await fetch(
          'https://uumgewfrulrhiqnfeoas.supabase.co/functions/v1/weather-proxy',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat: latitude, lon: longitude }),
          }
        );
        
        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ERROR') {
          throw new Error(data.error || 'Unknown error fetching weather data');
        }
        
        // Process the Meteomatics data
        const processedData = processWeatherData(data, latitude, longitude);
        setWeather(processedData);
        
      } catch (apiError) {
        console.error('Error fetching weather data:', apiError);
        setError('Failed to fetch weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, []);

  return { weather, loading, error };
};

// Helper function to process raw weather data
const processWeatherData = (apiData: any, latitude: number, longitude: number): WeatherData => {
  try {
    // Extract coordinates if available
    const coords = apiData.coordinates || { latitude, longitude };
    
    // Extract temperature data (first value from time series)
    // Fix: Use bracket notation for properties with special characters
    const tempData = apiData.data["t_2m:C"]?.coordinates[0]?.dates[0] || {};
    const temp = Math.round(tempData.value || 20);
    
    // Extract precipitation data
    const precipData = apiData.data["precip_1h:mm"]?.coordinates[0]?.dates[0] || {};
    const precip = Math.round(precipData.value * 10) / 10 || 0;
    
    // Extract wind speed data
    const windData = apiData.data["wind_speed_10m:ms"]?.coordinates[0]?.dates[0] || {};
    const windSpeed = Math.round(windData.value || 0);
    
    // Extract weather symbol
    const symbolData = apiData.data["weather_symbol_1h:idx"]?.coordinates[0]?.dates[0] || {};
    const symbolValue = symbolData.value || 1;
    
    // Map symbol code to condition and description
    const { condition, description } = getWeatherCondition(symbolValue);
    
    // Extract UV index
    const uvData = apiData.data["uv:idx"]?.coordinates[0]?.dates[0] || {};
    const uvIndex = Math.round(uvData.value || 0);
    
    // Extract humidity data
    const humidityData = apiData.data["relative_humidity_2m:p"]?.coordinates[0]?.dates[0] || {};
    const humidity = Math.round(humidityData.value || 50);
    
    // Calculate sunrise and sunset using our utility
    const now = new Date();
    const { sunrise, sunset } = computeSunriseSunset(now, latitude, longitude);
    
    // Convert UTC times to local timezone
    const localSunrise = utcToLocalTime(sunrise);
    const localSunset = utcToLocalTime(sunset);
    
    // Calculate day duration
    const riseHour = parseInt(localSunrise.split(':')[0]);
    const riseMin = parseInt(localSunrise.split(':')[1]);
    const setHour = parseInt(localSunset.split(':')[0]);
    const setMin = parseInt(localSunset.split(':')[1]);
    
    let dayHours = setHour - riseHour;
    let dayMins = setMin - riseMin;
    
    if (dayMins < 0) {
      dayHours -= 1;
      dayMins += 60;
    }
    
    const dayDuration = `${dayHours}h ${dayMins}m`;
    
    return {
      location: "Your Location", // We could do reverse geocoding for the actual name
      temperature: temp,
      condition,
      description,
      precipitation: precip,
      windSpeed,
      uvIndex,
      sunrise: localSunrise,
      sunset: localSunset,
      dayDuration,
      humidity
    };
  } catch (error) {
    console.error('Error processing weather data:', error);
    return {
      location: "Unknown",
      temperature: 20,
      condition: "Clear",
      description: "Weather data unavailable",
      precipitation: 0,
      windSpeed: 0
    };
  }
};

// Weather condition mapping utility
const getWeatherCondition = (symbolCode: number): { condition: string; description: string } => {
  // Basic mapping of Meteomatics weather symbols to conditions and descriptions
  // https://www.meteomatics.com/en/api/available-parameters/weather-parameter/
  const conditions: Record<number, { condition: string; description: string }> = {
    1: { condition: "Clear", description: "Clear sky" },
    2: { condition: "FewClouds", description: "Few clouds" },
    3: { condition: "PartlyCloudy", description: "Partly cloudy" },
    4: { condition: "Cloudy", description: "Cloudy" },
    5: { condition: "Cloudy", description: "Very cloudy" },
    6: { condition: "Foggy", description: "Fog" },
    7: { condition: "LightRain", description: "Light rain" },
    8: { condition: "Rain", description: "Rain" },
    9: { condition: "HeavyRain", description: "Heavy rain" },
    10: { condition: "Thunderstorm", description: "Thunderstorm" },
    // ... more mappings could be added
  };
  
  return conditions[symbolCode] || { condition: "Unknown", description: "Unknown conditions" };
};
