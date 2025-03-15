
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeSunriseSunset, utcToLocalTime } from "@/lib/solarCalculations";
import { Cloud, CloudRain, Sun, Wind, Droplets, ArrowUp } from "lucide-react";

// Define the missing interfaces
interface ForecastDay {
  date: string;
  temperature: number;
  condition: string;
}

interface HourlyPrecipitation {
  hour: string;
  value: number;
}

interface TemperatureComparison {
  yesterday: number;
  today: number;
  difference: number;
}

// Update the WeatherData interface to include humidity
interface WeatherData {
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

export const WeatherWidget: React.FC = () => {
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
          'https://jlcnjcbjxtnzmwnbmgzr.supabase.co/functions/v1/weather-proxy',
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
  
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Clear':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'FewClouds':
      case 'PartlyCloudy':
      case 'Cloudy':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      case 'LightRain':
      case 'Rain':
      case 'HeavyRain':
        return <CloudRain className="h-8 w-8 text-blue-400" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-6 text-center">
          <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500">{error}</p>
          <p className="text-gray-500 mt-2">Please check your connection and try again.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Main content when data is available
  if (weather) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-sky-50 hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main weather information */}
            <div className="flex items-center">
              <div className="mr-4">
                {getWeatherIcon(weather.condition)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{weather.location}</h3>
                <p className="text-4xl font-bold text-gray-800">{weather.temperature}°C</p>
                <p className="text-gray-600">{weather.description}</p>
              </div>
            </div>
            
            {/* Weather details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-sm text-gray-500">Rain</p>
                <p className="font-semibold">{weather.precipitation} mm</p>
              </div>
              
              <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                <Wind className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-sm text-gray-500">Wind</p>
                <p className="font-semibold">{weather.windSpeed} m/s</p>
              </div>
              
              <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                <ArrowUp className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                <p className="text-sm text-gray-500">UV Index</p>
                <p className="font-semibold">{weather.uvIndex || 'N/A'}</p>
              </div>
              
              <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-sm text-gray-500">Humidity</p>
                <p className="font-semibold">{weather.humidity || 'N/A'}%</p>
              </div>
            </div>
          </div>
          
          {/* Sunrise and sunset information */}
          <div className="mt-6 grid grid-cols-3 gap-4 bg-white p-3 rounded-lg shadow-sm">
            <div className="text-center">
              <p className="text-sm text-gray-500">Sunrise</p>
              <p className="font-semibold">{weather.sunrise}</p>
            </div>
            
            <div className="text-center border-x border-gray-100">
              <p className="text-sm text-gray-500">Day Duration</p>
              <p className="font-semibold">{weather.dayDuration}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">Sunset</p>
              <p className="font-semibold">{weather.sunset}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Fallback for unexpected state
  return (
    <Card className="w-full bg-white">
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">Weather information unavailable</p>
      </CardContent>
    </Card>
  );
};
