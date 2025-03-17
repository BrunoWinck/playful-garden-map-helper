
import { useState, useEffect } from "react";
import { computeSunriseSunset, utcToLocalTime } from "@/lib/solarCalculations";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import { useClimateData } from "./useClimateData";

// Types
export interface ForecastDay {
  date: string;
  temperature: number;
  condition: string;
}

export interface HourlyPrecipitation {
  hour: string;
  value: number;
}

export interface TemperatureComparison {
  yesterday: number;
  today: number;
  difference: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
  forecast?: ForecastDay[];
  hourlyPrecipitation?: HourlyPrecipitation[];
  tempComparison?: TemperatureComparison;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  dayDuration?: string;
  humidity?: number;
  isClimateFallback?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const useWeatherData = () => {
  const { currentUser } = useProfile();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { currentMonthData, loading: climateLoading } = useClimateData();

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Starting to fetch weather data...");
        
        // Get location from settings instead of using geolocation API
        const settingsData = localStorage.getItem("gardenSettings");
        let latitude = 45.882550; // Default coordinates if settings not found
        let longitude = 2.905965;
        
        if (settingsData) {
          try {
            console.log("Garden settings found:", settingsData);
            const settings = JSON.parse(settingsData);
            if (settings.location) {
              console.log("Location from settings:", settings.location);
              const [lat, lon] = settings.location.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lon)) {
                latitude = lat;
                longitude = lon;
                console.log("Using coordinates from settings:", latitude, longitude);
              }
            }
          } catch (parseError) {
            console.error('Error parsing settings:', parseError);
          }
        } else {
          console.log("No garden settings found, using default coordinates");
        }

        console.log("Final coordinates being used:", latitude, longitude);
        
        // Call the Supabase Edge Function for weather data using the SDK
        console.log("Calling weather-proxy edge function with coordinates:", { lat: latitude, lon: longitude });
        
        // Use supabase client for proper authorization
        const { data: functionData, error: functionError } = await supabase.functions.invoke('weather-proxy', {
          body: { 
            lat: latitude, 
            lon: longitude,
            userId  // Pass the user ID for climate data fallback
          }
        });
        
        if (functionError) {
          console.error("Edge function error:", functionError);
          throw new Error(`Weather API error: ${functionError.message}`);
        }
        
        console.log("Edge function response received:", functionData ? "Data received" : "No data");
        
        if (!functionData) {
          throw new Error("Weather API returned empty response");
        }
        
        if (functionData.status === 'ERROR') {
          console.error("Weather API returned error:", functionData.error);
          throw new Error(functionData.error || 'Unknown error fetching weather data');
        }
        
        // Store debug info
        setDebugInfo(functionData);
        
        // Set the last updated timestamp
        setLastUpdated(new Date().toISOString());
        
        // Process the Meteomatics data
        console.log("Processing weather data...");
        const processedData = processWeatherData(functionData, latitude, longitude);
        console.log("Weather data processed successfully");
        
        setWeather(processedData);
        console.log("Weather state updated with processed data");
        
      } catch (apiError) {
        console.error('Error fetching weather data:', apiError);
        setError(`Failed to fetch weather data: ${apiError.message}`);
      } finally {
        setLoading(false);
        console.log("Weather data loading completed");
      }
    };
    
    if (currentUser) {
      fetchWeatherData();
    }
  }, [userId, currentUser]);

  return { weather, loading, error, lastUpdated, debugInfo };
};

// Helper function to process raw weather data
const processWeatherData = (apiData: any, latitude: number, longitude: number): WeatherData => {
  try {
    console.log("Processing weather data with raw data:", 
      apiData ? "Data available" : "No data",
      "latitude:", latitude,
      "longitude:", longitude
    );
    console.log("apiData:", apiData);
    
    // Extract coordinates if available
    const coords = apiData.coordinates || { latitude, longitude };
    console.log("Using coordinates:", coords);
    
    // Check if we're using climate fallback data
    const isClimateFallback = apiData.isClimateFallback || false;
    console.log("Using climate fallback data:", isClimateFallback);
    
    function getData( apiData, parameter, def ) {
      // weird the format depends on the number of params asked
      const data = ( Array.isArray( apiData.data))
        ? apiData.data.find( data => data.parameter == parameter)
        : apiData.data[  parameter];
        if (data)
          return data.coordinates[0].dates[0].value;
        else
          return def;
    }

    // Extract temperature data (first value from time series)
    // Fix: Use bracket notation for properties with special characters
    const tempData = getData( apiData, "t_2m:C", 20);
    const temp = Math.round(tempData);
    console.log("Temperature data:", tempData, "Processed temp:", temp);
    
    // Extract precipitation data
    const precipData = getData( apiData, "precip_1h:mm", 0);
    const precip = Math.round(precipData * 10) / 10;
    console.log("Precipitation data:", precipData, "Processed precip:", precip);
    
    // Extract wind speed data
    const windData = getData( apiData, "wind_speed_10m:ms", 0);
    const windSpeed = Math.round(windData);
    console.log("Wind data:", windData, "Processed wind speed:", windSpeed);
    
    // Extract weather symbol
    const symbolData = getData( apiData, "weather_symbol_1h:idx", 1);
    const symbolValue = symbolData;
    console.log("Symbol data:", symbolData, "Symbol value:", symbolValue);
    
    // Map symbol code to condition and description
    const { condition, description } = getWeatherCondition(symbolValue);
    console.log("Mapped condition:", condition, "description:", description);
    
    // Extract UV index
    const uvData = getData( apiData, "uv:idx", 0);
    const uvIndex = Math.round(uvData);
    console.log("UV data:", uvData, "Processed UV index:", uvIndex);
    
    // Extract humidity data
    // Not in basic data!
    const humidityData = getData( apiData, "relative_humidity_2m:p", 50);
    const humidity = Math.round(humidityData);
    console.log("Humidity data:", humidityData, "Processed humidity:", humidity);
    
    // Calculate sunrise and sunset using our utility
    const now = new Date();
    console.log("Calculating sunrise/sunset for date:", now);
    const { sunrise, sunset } = computeSunriseSunset(now, latitude, longitude);
    console.log("Computed sunrise (UTC):", sunrise, "sunset (UTC):", sunset);
    
    // Convert UTC times to local timezone
    const localSunrise = utcToLocalTime(sunrise);
    const localSunset = utcToLocalTime(sunset);
    console.log("Local sunrise:", localSunrise, "Local sunset:", localSunset);
    
    // Calculate day duration
    const riseHour = parseInt(localSunrise.split(':')[0]);
    const riseMin = parseInt(localSunrise.split(':')[1]);
    const setHour = parseInt(localSunset.split(':')[0]);
    const setMin = parseInt(localSunset.split(':')[1]);
    
    let dayHours = setHour - riseHour;
    let dayMins = setMin - riseMin;
    
    if (dayMins < 0) {
      dayHours -= 1;
      dayMins += 60;
    }
    
    const dayDuration = `${dayHours}h ${dayMins}m`;
    console.log("Calculated day duration:", dayDuration);
    
    const result = {
      location: "Your Location", // We could do reverse geocoding for the actual name
      temperature: temp,
      condition,
      description: isClimateFallback ? description + " (Using climate averages)" : description,
      precipitation: precip,
      windSpeed,
      uvIndex,
      sunrise: localSunrise,
      sunset: localSunset,
      dayDuration,
      humidity,
      isClimateFallback,
      coordinates: coords // Include coordinates in the result
    };
    
    console.log("Final processed weather data:", result);
    return result;
  } 
  catch (error) 
  {
    console.error('Error processing weather data:', error);
    return {
      location: "Unknown",
      temperature: 20,
      condition: "Clear",
      description: "Weather data unavailable",
      precipitation: 0,
      windSpeed: 0
    };
  }
};

// Weather condition mapping utility
const getWeatherCondition = (symbolCode: number): { condition: string; description: string } => {
  // Basic mapping of Meteomatics weather symbols to conditions and descriptions
  // https://www.meteomatics.com/en/api/available-parameters/weather-parameter/
  const conditions: Record<number, { condition: string; description: string }> = {
    1: { condition: "Clear", description: "Clear sky" },
    2: { condition: "FewClouds", description: "Few clouds" },
    3: { condition: "PartlyCloudy", description: "Partly cloudy" },
    4: { condition: "Cloudy", description: "Cloudy" },
    5: { condition: "Cloudy", description: "Very cloudy" },
    6: { condition: "Foggy", description: "Fog" },
    7: { condition: "LightRain", description: "Light rain" },
    8: { condition: "Rain", description: "Rain" },
    9: { condition: "HeavyRain", description: "Heavy rain" },
    10: { condition: "Thunderstorm", description: "Thunderstorm" },
    // ... more mappings could be added
  };
  
  return conditions[symbolCode] || { condition: "Unknown", description: "Unknown conditions" };
};
