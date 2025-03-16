
import React from "react";
import { WeatherData } from "@/hooks/useWeatherData";
import { Droplets, Wind, ArrowUp } from "lucide-react";

interface WeatherDetailsProps {
  weather: WeatherData;
}

function isSet(value: number | undefined): value is number {
  return value !== undefined;
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ weather }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="text-center p-2 bg-white rounded-lg shadow-sm">
        <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
        <p className="text-sm text-gray-500 mb-2">Rain</p>
        <p className="font-semibold">{weather.precipitation}&nbsp;mm</p>
      </div>
      
      <div className="text-center p-2 bg-white rounded-lg shadow-sm">
        <Wind className="h-5 w-5 mx-auto text-blue-500 mb-1" />
        <p className="text-sm text-gray-500 mb-2">Wind</p>
        <p className="font-semibold">{weather.windSpeed}&nbsp;m/s</p>
      </div>
      
      <div className="text-center p-2 bg-white rounded-lg shadow-sm">
        <ArrowUp className="h-5 w-5 mx-auto text-orange-500 mb-1" />
        <p className="text-sm text-gray-500 mb-2">UV</p>
        <p className="font-semibold">{isSet(weather.uvIndex) ? weather.uvIndex : 'N/A'}</p>
      </div>
      
      <div className="text-center p-2 bg-white rounded-lg shadow-sm">
        <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
        <p className="text-sm text-gray-500 mb-2">Humid.</p>
        <p className="font-semibold">{isSet(weather.humidity) ? weather.humidity : 'N/A'}&nbsp;%</p>
      </div>
    </div>
  );
};
