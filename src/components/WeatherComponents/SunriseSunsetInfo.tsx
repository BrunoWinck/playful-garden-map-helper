
import React from "react";
import { WeatherData } from "@/hooks/useWeatherData";

interface SunriseSunsetInfoProps {
  weather: WeatherData;
}

export const SunriseSunsetInfo: React.FC<SunriseSunsetInfoProps> = ({ weather }) => {
  return (
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
  );
};
