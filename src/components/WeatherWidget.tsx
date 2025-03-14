
import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Paris coordinates
    const lat = 48.8566;
    const lon = 2.3522;
    
    const fetchWeather = async () => {
      try {
        // We're using the free OpenWeatherMap API
        const apiKey = "eac138b833f4a699f2cec3895fef52fa"; // Free API key for demo purposes
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error("Weather data not available");
        }
        
        const data = await response.json();
        
        setWeather({
          location: "Paris, France",
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          icon: data.weather[0].icon
        });
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Could not load weather data");
        
        // Fallback data
        setWeather({
          location: "Paris, France",
          temperature: 22,
          condition: "Clouds",
          description: "scattered clouds",
          humidity: 65,
          windSpeed: 3.5
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
            <span>{weather.location}</span>
            {getWeatherIcon(weather.condition)}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold flex items-center">
              <Thermometer className="h-5 w-5 mr-1" />
              {weather.temperature}°C
            </div>
            <div className="text-sm capitalize">{weather.description}</div>
            <div className="text-sm">Humidity: {weather.humidity}%</div>
            <div className="text-sm">Wind: {weather.windSpeed} m/s</div>
          </div>
        </div>
      )}
    </div>
  );
};
