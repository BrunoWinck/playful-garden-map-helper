
import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching weather data
    setTimeout(() => {
      setWeather({
        location: "Paris, France",
        temperature: 22,
        condition: "Partly Cloudy",
        humidity: 65
      });
      setLoading(false);
    }, 1500);

    // In a real app, you would fetch from a weather API:
    // fetch('https://api.openweathermap.org/data/2.5/weather?q=Paris,fr&appid=YOUR_API_KEY')
    //   .then(res => res.json())
    //   .then(data => {
    //     setWeather({
    //       location: "Paris, France",
    //       temperature: Math.round(data.main.temp - 273.15),
    //       condition: data.weather[0].main,
    //       humidity: data.main.humidity
    //     });
    //     setLoading(false);
    //   })
    //   .catch(error => {
    //     console.error("Error fetching weather data:", error);
    //     setLoading(false);
    //   });
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-400" />;
      case "rain":
        return <CloudRain className="h-8 w-8 text-blue-400" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-300" />;
    }
  };

  return (
    <div className="bg-green-700 rounded-lg p-3">
      <h3 className="text-lg font-semibold mb-2">Weather</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-green-600" />
          <Skeleton className="h-4 w-2/3 bg-green-600" />
          <Skeleton className="h-4 w-1/2 bg-green-600" />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <span>{weather.location}</span>
            {getWeatherIcon(weather.condition)}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{weather.temperature}°C</div>
            <div className="text-sm">{weather.condition}</div>
            <div className="text-sm">Humidity: {weather.humidity}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
