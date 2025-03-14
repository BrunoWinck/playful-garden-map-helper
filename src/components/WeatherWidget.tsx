
import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  precipitation: number;
  windSpeed: number;
}

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Coordinates for the garden in France
    const lat = 45.882550;
    const lon = 2.905965;
    
    const fetchMeteomaticsWeather = async (): Promise<WeatherData | null> => {
      try {
        // Current time in ISO format
        const now = new Date().toISOString().split('.')[0] + 'Z';
        const endTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
        
        // Create Basic Authentication header
        const username = "na_winck_bruno";
        const password = "3Ijssv14QC";
        const authHeader = 'Basic ' + btoa(username + ':' + password);
        
        const url = `https://api.meteomatics.com/${now}--${endTime}:PT1H/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;
        
        console.log("Fetching Meteomatics weather from:", url);
        
        // Try to use a CORS proxy if available
        const response = await fetch(url, {
          headers: {
            'Authorization': authHeader
          }
        });
        
        if (!response.ok) {
          throw new Error(`Meteomatics API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Meteomatics data received:", data);
        
        // Parse the Meteomatics response format
        return parseMeteomaticsData(data);
      } catch (err) {
        console.error("Error fetching Meteomatics weather:", err);
        throw err;
      }
    };

    const fetchOpenWeatherMap = async (): Promise<WeatherData | null> => {
      try {
        // Use OpenWeatherMap API - this API allows CORS requests from browsers
        const apiKey = "df9e9a54f5ccc054c06162e7ac854647"; // This is a free tier API key
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
        // First try Meteomatics
        let weatherData = null;
        try {
          weatherData = await fetchMeteomaticsWeather();
          console.log("Successfully fetched from Meteomatics API");
          toast({
            title: "Weather Updated",
            description: "Weather data successfully loaded from Meteomatics.",
          });
        } catch (meteomaticsError) {
          console.log("Meteomatics API failed, trying OpenWeatherMap...");
          
          // If Meteomatics fails, try OpenWeatherMap
          try {
            weatherData = await fetchOpenWeatherMap();
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
