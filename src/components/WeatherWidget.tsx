
import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Coordinates for the garden in France
    const lat = 45.882550;
    const lon = 2.905965;
    
    const fetchWeather = async () => {
      try {
        // Get current time for API request
        const now = new Date();
        const startTime = now.toISOString().split('.')[0] + "Z";
        
        // Calculate end time (3 days from now)
        const endTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + "Z";
        
        // Format URL with current time and coordinates
        const url = `https://api.meteomatics.com/${startTime}--${endTime}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;
        
        console.log("Fetching weather from:", url);
        
        // Add Basic Authentication
        const username = "na_winck_bruno";
        const password = "3Ijssv14QC";
        const authString = btoa(`${username}:${password}`);
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `Basic ${authString}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Weather data received:", data);
        
        // Parse the response
        const parsedData = parseWeatherData(data);
        setWeather(parsedData);
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Could not load weather data");
        
        // Fallback data in case of error
        setWeather({
          location: "Auvergne-Rhône-Alpes, France",
          temperature: 17,
          condition: "Clouds",
          description: "scattered clouds",
          precipitation: 0.2,
          windSpeed: 2.8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const parseWeatherData = (data: any): WeatherData => {
    try {
      // Extract the first data point (current weather)
      const temperatureData = data.data[0].coordinates[0].dates[0].value;
      const precipitationData = data.data[1].coordinates[0].dates[0].value;
      const windSpeedData = data.data[2].coordinates[0].dates[0].value;
      
      // Determine condition based on temperature and precipitation
      const condition = getWeatherConditionFromTemp(temperatureData, precipitationData);
      
      // Generate description based on condition and values
      let description = "Clear skies";
      if (precipitationData > 5) description = "Heavy rain";
      else if (precipitationData > 1) description = "Light rain";
      else if (precipitationData > 0.1) description = "Drizzle";
      else if (temperatureData > 25) description = "Sunny and warm";
      else if (temperatureData > 15) description = "Partly cloudy";
      else if (temperatureData < 5) description = "Cold";
      
      return {
        location: "Auvergne-Rhône-Alpes, France",
        temperature: Math.round(temperatureData),
        condition,
        description,
        precipitation: Math.round(precipitationData * 10) / 10,
        windSpeed: Math.round(windSpeedData * 10) / 10
      };
    } catch (error) {
      console.error("Error parsing weather data:", error);
      // Return fallback data
      return {
        location: "Auvergne-Rhône-Alpes, France",
        temperature: 17,
        condition: "Clouds",
        description: "Weather data unavailable",
        precipitation: 0,
        windSpeed: 0
      };
    }
  };

  const getWeatherConditionFromTemp = (temp: number, precip: number): string => {
    if (precip > 5) return "Thunderstorm";
    if (precip > 1) return "Rain";
    if (precip > 0.1) return "Drizzle";
    if (temp > 25) return "Clear";
    if (temp < 5) return "Snow";
    return "Clouds";
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-400" />;
      case "rain":
      case "drizzle":
        return <CloudRain className="h-8 w-8 text-blue-400" />;
      case "thunderstorm":
        return <Umbrella className="h-8 w-8 text-purple-400" />;
      case "snow":
        return <CloudRain className="h-8 w-8 text-white" />;
      case "mist":
      case "fog":
        return <Wind className="h-8 w-8 text-gray-300" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-300" />;
    }
  };

  return (
    <div className="bg-green-700 rounded-lg p-3 text-white">
      <h3 className="text-lg font-semibold mb-2">Weather</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-green-600" />
          <Skeleton className="h-4 w-2/3 bg-green-600" />
          <Skeleton className="h-4 w-1/2 bg-green-600" />
        </div>
      ) : error ? (
        <div className="text-yellow-200 text-sm">
          {error}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <span>{weather?.location}</span>
            {weather && getWeatherIcon(weather.condition)}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold flex items-center">
              <Thermometer className="h-5 w-5 mr-1" />
              {weather?.temperature}°C
            </div>
            <div className="text-sm capitalize">{weather?.description}</div>
            <div className="text-sm">Precipitation: {weather?.precipitation} mm</div>
            <div className="text-sm">Wind: {weather?.windSpeed} m/s</div>
          </div>
        </div>
      )}
    </div>
  );
};
