
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useWeatherData } from "@/hooks/useWeatherData";
import { WeatherMainInfo } from "./WeatherComponents/WeatherMainInfo";
import { WeatherDetails } from "./WeatherComponents/WeatherDetails";
import { SunriseSunsetInfo } from "./WeatherComponents/SunriseSunsetInfo";
import { WeatherLoadingSkeleton } from "./WeatherComponents/WeatherLoadingSkeleton";
import { WeatherErrorDisplay } from "./WeatherComponents/WeatherErrorDisplay";
import { formatDistanceToNow, isAfter, subWeeks } from "date-fns";
import { MoonInfo } from "./WeatherComponents/MoonInfo";

export const WeatherWidget: React.FC = () => {
  const { weather, loading, error, lastUpdated, debugInfo } = useWeatherData();
  
  // Format the last updated time in a more concise way
  const formatLastUpdated = () => {
    if (!lastUpdated) return "never fetched";
    
    const lastUpdatedDate = new Date(lastUpdated);
    const oneWeekAgo = subWeeks(new Date(), 1);
    
    if (isAfter(lastUpdatedDate, oneWeekAgo)) {
      // Format to more concise version like "1 min ago" instead of "less than a minute ago"
      let timeText = formatDistanceToNow(lastUpdatedDate, { addSuffix: true });
      
      // Replace "less than a minute ago" with "1 min ago"
      if (timeText.includes("less than a minute")) {
        timeText = "1 min ago";
      }
      
      // Replace "about X hours ago" with "X hr ago"
      timeText = timeText.replace("about ", "")
                         .replace(" minutes", " min")
                         .replace(" minute", " min")
                         .replace(" hours", " hr")
                         .replace(" hour", " hr")
                         .replace(" days", " d")
                         .replace(" day", " d");
      
      return timeText;
    } else {
      return lastUpdatedDate.toLocaleDateString();
    }
  };
  
  const lastUpdatedText = lastUpdated ? formatLastUpdated() : '';
    
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
            <WeatherMainInfo 
              weather={weather} 
              lastUpdatedText={lastUpdatedText} 
              debugInfo={debugInfo}
            />
            
            {/* Weather details */}
            <WeatherDetails weather={weather} />
          </div>
          
          {/* Sunrise and sunset information */}
          <SunriseSunsetInfo weather={weather} />
          
          {/* Moon information */}
          {weather.coordinates && (
            <MoonInfo 
              latitude={weather.coordinates.latitude} 
              longitude={weather.coordinates.longitude} 
            />
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Fallback for unexpected state
  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-sky-50">
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">Weather information unavailable</p>
      </CardContent>
    </Card>
  );
};
