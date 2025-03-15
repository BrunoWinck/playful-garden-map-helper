import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
}

interface GardenSettings {
  location: string;
  lengthUnit: string;
  temperatureUnit: string;
  language: string;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Default coordinates as fallback
    let lat = 45.882550;
    let lon = 2.905965;

    const loadCoordinates = async () => {
      try {
        // First try to get coordinates from Supabase user settings
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data: userSettings, error } = await supabase
            .from('user_settings')
            .select('location')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (!error && userSettings?.location) {
            const [latitude, longitude] = userSettings.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(latitude) && !isNaN(longitude)) {
              lat = latitude;
              lon = longitude;
              console.log("Using coordinates from Supabase settings:", lat, lon);
              return { lat, lon };
            }
          }
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem("gardenSettings");
        if (savedSettings) {
          const settings: GardenSettings = JSON.parse(savedSettings);
          if (settings.location) {
            const [latitude, longitude] = settings.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(latitude) && !isNaN(longitude)) {
              lat = latitude;
              lon = longitude;
              console.log("Using coordinates from localStorage settings:", lat, lon);
              return { lat, lon };
            }
          }
        }
        
        // Return default if no other sources available
        console.log("Using default coordinates:", lat, lon);
        return { lat, lon };
      } catch (error) {
        console.error("Error getting coordinates:", error);
        return { lat, lon }; // Return defaults on error
      }
    };
    
    const fetchMeteomaticsWeatherViaEdgeFunction = async (lat: number, lon: number): Promise<WeatherData | null> => {
      try {
        console.log("Fetching Meteomatics weather via edge function");
        
        const { data, error } = await supabase.functions.invoke('weather-proxy', {
          body: { lat, lon }
        });
        
        if (error) {
          console.error("Edge function error:", error);
          throw new Error(error.message || "Failed to send a request to the Edge Function");
        }
        
        if (!data) {
          throw new Error("No data returned from Meteomatics API");
        }
        
        console.log("Edge function returned data:", data);
        
        // Parse the Meteomatics response format
        return parseMeteomaticsData(data);
      } catch (err) {
        console.error("Error fetching Meteomatics weather via edge function:", err);
        throw err;
      }
    };

    const fetchOpenWeatherMap = async (lat: number, lon: number): Promise<WeatherData | null> => {
      try {
        // Use OpenWeatherMap API - this API allows CORS requests from browsers
        const apiKey = "df9e9a54f5ccc054c06162e7ac854647"; 
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        console.log("Fetching OpenWeatherMap weather from:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("OpenWeatherMap data received:", data);
        
        // Parse the OpenWeatherMap response format
        return parseOpenWeatherData(data);
      } catch (err) {
        console.error("Error fetching OpenWeatherMap weather:", err);
        throw err;
      }
    };

    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Get coordinates
        const { lat, lon } = await loadCoordinates();
        
        // First try Meteomatics via the edge function
        let weatherData = null;
        try {
          weatherData = await fetchMeteomaticsWeatherViaEdgeFunction(lat, lon);
          console.log("Successfully fetched from Meteomatics API via edge function");
          toast({
            title: "Weather Updated",
            description: "Weather data successfully loaded from Meteomatics.",
          });
        } catch (meteomaticsError) {
          console.log("Meteomatics API failed, trying OpenWeatherMap...", meteomaticsError);
          
          // If Meteomatics fails, try OpenWeatherMap
          try {
            weatherData = await fetchOpenWeatherMap(lat, lon);
            console.log("Successfully fell back to OpenWeatherMap API");
            toast({
              title: "Weather Updated",
              description: "Weather data loaded from OpenWeatherMap (fallback).",
            });
          } catch (openWeatherError) {
            console.error("Both APIs failed:", openWeatherError);
            throw new Error("All weather data sources failed");
          }
        }
        
        if (weatherData) {
          setWeather(weatherData);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching weather from all sources:", err);
        setError("Could not load weather data from any source");
        toast({
          title: "Weather Error",
          description: "Could not load weather data. Using fallback information.",
          variant: "destructive",
        });
        
        // Fallback data in case of error
        setWeather({
          location: "Auvergne-Rhône-Alpes, France",
          temperature: 17,
          condition: "Clouds",
          description: "scattered clouds",
          precipitation: 0.2,
          windSpeed: 2.8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [toast]);
  
  const parseMeteomaticsData = (data: any): WeatherData => {
    try {
      // Extract temperature data from the first time point
      const temperatureData = data.data[0].coordinates[0].dates[0].value;
      // Extract precipitation data
      const precipitationData = data.data[1].coordinates[0].dates[0].value;
      // Extract wind speed data
      const windSpeedData = data.data[2].coordinates[0].dates[0].value;
      
      // Determine weather condition based on precipitation
      let condition = "Clear";
      let description = "clear sky";
      
      if (precipitationData > 0) {
        if (precipitationData > 5) {
          condition = "Rain";
          description = "heavy rain";
        } else {
          condition = "Rain";
          description = "light rain";
        }
      } else if (temperatureData < 0) {
        condition = "Snow";
        description = "snow";
      } else if (windSpeedData > 10) {
        condition = "Wind";
        description = "strong winds";
      } else {
        condition = "Clear";
        description = "clear sky";
      }
      
      return {
        location: "Auvergne-Rhône-Alpes, France", // Hardcoded for this location
        temperature: Math.round(temperatureData),
        condition,
        description,
        precipitation: Math.round(precipitationData * 10) / 10,
        windSpeed: Math.round(windSpeedData * 10) / 10
      };
    } catch (error) {
      console.error("Error parsing Meteomatics data:", error);
      throw error;
    }
  };
  
  const parseOpenWeatherData = (data: any): WeatherData => {
    try {
      // Extract relevant data from OpenWeatherMap response
      const temperature = data.main.temp;
      const condition = data.weather[0].main;
      const description = data.weather[0].description;
      const windSpeed = data.wind.speed;
      
      // OpenWeatherMap doesn't directly provide precipitation in mm
      // We can estimate from rain or snow data if available
      let precipitation = 0;
      if (data.rain && data.rain['1h']) {
        precipitation = data.rain['1h'];
      } else if (data.snow && data.snow['1h']) {
        precipitation = data.snow['1h'];
      }
      
      return {
        location: "Auvergne-Rhône-Alpes, France", // We're hardcoding this as we know the location
        temperature: Math.round(temperature),
        condition,
        description,
        precipitation: Math.round(precipitation * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10
      };
    } catch (error) {
      console.error("Error parsing OpenWeatherMap data:", error);
      throw error;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-400" />;
      case "rain":
      case "drizzle":
        return <CloudRain className="h-8 w-8 text-blue-400" />;
      case "thunderstorm":
        return <Umbrella className="h-8 w-8 text-purple-400" />;
      case "snow":
        return <CloudRain className="h-8 w-8 text-white" />;
      case "mist":
      case "fog":
      case "wind":
        return <Wind className="h-8 w-8 text-gray-300" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-300" />;
    }
  };

  return (
    <div className="bg-green-700 rounded-lg p-3 text-white">
      <h3 className="text-lg font-semibold mb-2">Weather</h3>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-green-600" />
          <Skeleton className="h-4 w-2/3 bg-green-600" />
          <Skeleton className="h-4 w-1/2 bg-green-600" />
        </div>
      ) : error ? (
        <div className="text-yellow-200 text-sm">
          {error}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <span>{weather?.location}</span>
            {weather && getWeatherIcon(weather.condition)}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold flex items-center">
              <Thermometer className="h-5 w-5 mr-1" />
              {weather?.temperature}°C
            </div>
            <div className="text-sm capitalize">{weather?.description}</div>
            <div className="text-sm">Precipitation: {weather?.precipitation} mm</div>
            <div className="text-sm">Wind: {weather?.windSpeed} m/s</div>
          </div>
        </div>
      )}
    </div>
  );
};
