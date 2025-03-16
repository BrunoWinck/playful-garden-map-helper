
import React from "react";
import { WeatherData } from "@/hooks/useWeatherData";
import { WeatherIcon } from "./WeatherIcon";
import { formatDistanceToNow, isAfter, subWeeks } from "date-fns";

interface WeatherMainInfoProps {
  weather: WeatherData;
  lastUpdatedText?: string;
}

export const WeatherMainInfo: React.FC<WeatherMainInfoProps> = ({ weather, lastUpdatedText }) => {
  // Format the lastUpdated text to be more concise
  const formatLastUpdated = (lastUpdatedText?: string) => {
    if (!lastUpdatedText || lastUpdatedText === '') return null;
    
    // If it contains "never fetched", return that
    if (lastUpdatedText.includes("never fetched")) return "never fetched";
    
    return lastUpdatedText;
  };

  const formattedLastUpdated = formatLastUpdated(lastUpdatedText);

  return (
    <div className="flex items-center">
      <div className="mr-4">
        <WeatherIcon condition={weather.condition} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{weather.location}</h3>
        <p className="text-4xl font-bold text-gray-800">{weather.temperature}°C</p>
        <p className="text-gray-600">{weather.description}</p>
        {formattedLastUpdated && <p className="text-xs text-gray-500 mt-1">{formattedLastUpdated}</p>}
      </div>
    </div>
  );
};
