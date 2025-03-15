
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWeatherData } from "@/hooks/useWeatherData";
import { WeatherMainInfo } from "./WeatherComponents/WeatherMainInfo";
import { WeatherDetails } from "./WeatherComponents/WeatherDetails";
import { SunriseSunsetInfo } from "./WeatherComponents/SunriseSunsetInfo";
import { WeatherLoadingSkeleton } from "./WeatherComponents/WeatherLoadingSkeleton";
import { WeatherErrorDisplay } from "./WeatherComponents/WeatherErrorDisplay";

export const WeatherWidget: React.FC = () => {
  const { weather, loading, error } = useWeatherData();
  
  // Loading state
  if (loading) {
    return <WeatherLoadingSkeleton />;
  }
  
  // Error state
  if (error) {
    return <WeatherErrorDisplay error={error} />;
  }
  
  // Main content when data is available
  if (weather) {
    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-sky-50 hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main weather information */}
            <WeatherMainInfo weather={weather} />
            
            {/* Weather details */}
            <WeatherDetails weather={weather} />
          </div>
          
          {/* Sunrise and sunset information */}
          <SunriseSunsetInfo weather={weather} />
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
