
import React from "react";
import { WeatherData } from "@/hooks/useWeatherData";
import { computeSunlightExposure } from "@/lib/sunlightCalculations";

interface SunriseSunsetInfoProps {
  weather: WeatherData;
}

export const SunriseSunsetInfo: React.FC<SunriseSunsetInfoProps> = ({ weather }) => {
  // Calculate sunlight exposure metrics (UV Dose and DLI)
  const sunlightData = {
    uvIndexPeak: weather.uvIndex || 0,
    daylightHours: parseFloat(weather.dayDuration?.split('h')[0] || '0'),
    ppfd: 500, // Using fixed PPFD of 500 µmol/m²/s as specified
  };
  
  const { uvDose, dli } = computeSunlightExposure(sunlightData);
  
  return (
    <div className="mt-6 bg-white p-3 rounded-lg shadow-sm">
      <div className="grid grid-cols-3 gap-4 mb-3">
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
      
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">UV Dose</p>
          <p className="font-semibold">{uvDose.toFixed(1)}&nbsp;J/m²</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Daily Light Integral</p>
          <p className="font-semibold">{dli.toFixed(1)}&nbsp;mol/m²/day</p>
        </div>
      </div>
    </div>
  );
};
