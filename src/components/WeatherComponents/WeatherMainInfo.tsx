
import React, { useState, useEffect } from "react";
import { WeatherData } from "@/hooks/useWeatherData";
import { WeatherIcon } from "./WeatherIcon";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Bug, Info } from "lucide-react";

interface WeatherMainInfoProps {
  weather: WeatherData;
  lastUpdatedText?: string;
  debugInfo?: any;
}

export const WeatherMainInfo: React.FC<WeatherMainInfoProps> = ({ 
  weather, 
  lastUpdatedText,
  debugInfo
}) => {
  const [showDebug, setShowDebug] = useState(false);
  
  // Format the lastUpdated text to be more concise
  const formatLastUpdated = (lastUpdatedText?: string) => {
    if (!lastUpdatedText || lastUpdatedText === '') return null;
    
    // If it contains "never fetched", return that
    if (lastUpdatedText.includes("never fetched")) return "never fetched";
    
    return lastUpdatedText;
  };
  
  // Load debug preference from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("gardenSettings");
    if (savedSettings) {
      try {
        const { showWeatherDebug } = JSON.parse(savedSettings);
        if (showWeatherDebug !== undefined) {
          setShowDebug(showWeatherDebug);
        }
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
  }, []);

  const formattedLastUpdated = formatLastUpdated(lastUpdatedText);

  // Render debug info panel
  const renderDebugInfo = () => {
    if (!debugInfo) return <p className="text-sm text-gray-500">No debug information available</p>;
    
    return (
      <div className="text-xs font-mono overflow-x-auto bg-gray-100 p-2 rounded mt-2">
        <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div>
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
      
      {showDebug && debugInfo && (
        <Collapsible open={showDebug} className="mt-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-2 w-full flex items-center justify-between text-xs p-1">
              <span>Weather Debug Information</span>
              <Info className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>{renderDebugInfo()}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
