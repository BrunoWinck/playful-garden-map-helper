
import React from "react";
import { Cloud, CloudRain, Sun } from "lucide-react";

interface WeatherIconProps {
  condition: string;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, className = "h-8 w-8" }) => {
  switch (condition) {
    case 'Clear':
      return <Sun className={`${className} text-yellow-500`} />;
    case 'FewClouds':
    case 'PartlyCloudy':
    case 'Cloudy':
      return <Cloud className={`${className} text-gray-400`} />;
    case 'LightRain':
    case 'Rain':
    case 'HeavyRain':
      return <CloudRain className={`${className} text-blue-400`} />;
    default:
      return <Sun className={`${className} text-yellow-500`} />;
  }
};
