
import React from "react";
import { WeatherData } from "@/hooks/useWeatherData";
import { WeatherIcon } from "./WeatherIcon";

interface WeatherMainInfoProps {
  weather: WeatherData;
}

export const WeatherMainInfo: React.FC<WeatherMainInfoProps> = ({ weather }) => {
  return (
    <div className="flex items-center">
      <div className="mr-4">
        <WeatherIcon condition={weather.condition} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{weather.location}</h3>
        <p className="text-4xl font-bold text-gray-800">{weather.temperature}°C</p>
        <p className="text-gray-600">{weather.description}</p>
      </div>
    </div>
  );
};
