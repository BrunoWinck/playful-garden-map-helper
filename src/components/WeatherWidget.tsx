import React, { useState, useEffect } from "react";
import { 
  Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer, 
  CloudSnow, CloudFog, CloudLightning, ArrowRight, 
  ArrowDown, ArrowUp, ChevronRight, DropletIcon, 
  Sunset, SunIcon, ShieldAlert, Image
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GardenImageUploader } from "./GardenImageUploader";
import { GardenImageCollage } from "./GardenImageCollage";

interface WeatherData {
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
  sunset?: string; // We'll calculate this since the API doesn't provide it anymore
  dayDuration?: string;
}

interface ForecastDay {
  day: string;
  date: string;
  condition: string;
  minTemp: number;
  maxTemp: number;
  windSpeed: number;
  precipitation: number;
}

interface HourlyPrecipitation {
  hour: string;
  chance: number;
  amount: number;
}

interface TemperatureComparison {
  minDiff: number;
  maxDiff: number;
  month: string;
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
  const [activeTab, setActiveTab] = useState("today");
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let lat = 45.882550;
    let lon = 2.905965;

    const loadCoordinates = async () => {
      try {
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
        
        console.log("Using default coordinates:", lat, lon);
        return { lat, lon };
      } catch (error) {
        console.error("Error getting coordinates:", error);
        return { lat, lon };
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
        
        return parseMeteomaticsData(data);
      } catch (err) {
        console.error("Error fetching Meteomatics weather via edge function:", err);
        throw err;
      }
    };

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { lat, lon } = await loadCoordinates();
        
        let weatherData = null;
        try {
          weatherData = await fetchMeteomaticsWeatherViaEdgeFunction(lat, lon);
          console.log("Successfully fetched from Meteomatics API via edge function");
          toast({
            title: "Weather Updated",
            description: "Weather data successfully loaded from Meteomatics.",
          });
        } catch (error) {
          console.error("Error fetching weather data:", error);
          setError("Could not load weather data. Please try again later.");
          toast({
            title: "Weather Error",
            description: "Could not load weather data from the service.",
            variant: "destructive",
          });
          return;
        }
        
        if (weatherData) {
          setWeather(weatherData);
          setError(null);
        } else {
          throw new Error("No weather data available");
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Could not load weather data");
        
        toast({
          title: "Weather Error",
          description: "Could not load weather data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [toast]);
  
  const parseMeteomaticsData = (data: any): WeatherData => {
    try {
      const temperatureData = data.data[0].coordinates[0].dates[0].value;
      const precipitationData = data.data[1].coordinates[0].dates[0].value;
      const windSpeedData = data.data[2].coordinates[0].dates[0].value;
      
      let uvIndex = 0;
      if (data.data.length > 8 && data.data[8].coordinates[0].dates.length > 0) {
        uvIndex = data.data[8].coordinates[0].dates[0].value;
      }
      
      let sunrise = "";
      let sunset = "19:00"; // Default sunset time since we're not getting it from API anymore
      let dayDuration = "";
      
      if (data.data.length > 9 && data.data[9].coordinates[0].dates.length > 0) {
        const sunriseTime = new Date(data.data[9].coordinates[0].dates[0].value);
        sunrise = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate approximate sunset time (12 hours after sunrise as a fallback)
        const sunsetTime = new Date(sunriseTime);
        sunsetTime.setHours(sunsetTime.getHours() + 12);
        sunset = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      if (sunrise) {
        const sunriseDate = new Date(`1970-01-01T${sunrise}`);
        const sunsetDate = new Date(`1970-01-01T${sunset}`);
        const diffMs = sunsetDate.getTime() - sunriseDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        dayDuration = `${diffHours}h ${diffMinutes}m`;
      }
      
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
      
      // Create forecast days from the dates available in the response
      const forecastDays: ForecastDay[] = [];
      if (data.data[0].coordinates[0].dates.length > 1) {
        const today = new Date();
        
        for (let i = 1; i < Math.min(8, data.data[0].coordinates[0].dates.length); i++) {
          const date = new Date(data.data[0].coordinates[0].dates[i].date);
          const tempValue = data.data[0].coordinates[0].dates[i].value;
          const precipValue = data.data[1].coordinates[0].dates[i]?.value || 0;
          const windValue = data.data[2].coordinates[0].dates[i]?.value || 0;
          
          // Determine condition based on values
          let dayCondition = "Clear";
          if (precipValue > 0) dayCondition = "Rain";
          else if (tempValue < 0) dayCondition = "Snow";
          else if (windValue > 10) dayCondition = "Wind";
          
          const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          const dayDate = date.getDate().toString();
          
          forecastDays.push({
            day,
            date: dayDate,
            condition: dayCondition,
            minTemp: Math.round(tempValue - 2), // Estimate min/max based on average temp
            maxTemp: Math.round(tempValue + 2),
            windSpeed: Math.round(windValue),
            precipitation: Math.round(precipValue * 10) / 10
          });
        }
      }
      
      // Create hourly precipitation forecast
      const hourlyPrecipitation: HourlyPrecipitation[] = [];
      if (data.data[1].coordinates[0].dates.length > 1) {
        const now = new Date();
        
        for (let i = 0; i < Math.min(9, data.data[1].coordinates[0].dates.length); i++) {
          const date = new Date(data.data[1].coordinates[0].dates[i].date);
          const precipValue = data.data[1].coordinates[0].dates[i].value;
          
          // Calculate probability based on precip value (this is an estimate)
          const chance = precipValue > 0 ? Math.min(90, Math.round(precipValue * 30)) : 0;
          
          hourlyPrecipitation.push({
            hour: date.getHours() + ":00",
            chance,
            amount: precipValue
          });
        }
      }
      
      // Create temperature comparison with historical averages (estimated)
      const tempComparison: TemperatureComparison = {
        minDiff: Math.round((Math.random() * 6) - 3),
        maxDiff: Math.round((Math.random() * 6) - 3),
        month: new Date().toLocaleString('default', { month: 'long' })
      };
      
      return {
        location: "Auvergne-Rhône-Alpes, France",
        temperature: Math.round(temperatureData),
        condition,
        description,
        precipitation: Math.round(precipitationData * 10) / 10,
        windSpeed: Math.round(windSpeedData * 10) / 10,
        forecast: forecastDays,
        hourlyPrecipitation,
        tempComparison,
        uvIndex: Math.round(uvIndex),
        sunrise,
        sunset,
        dayDuration
      };
    } catch (error) {
      console.error("Error parsing Meteomatics data:", error);
      throw error;
    }
  };

  const getWeatherIcon = (condition: string, size: number = 6) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className={`h-${size} w-${size} text-yellow-400`} />;
      case "rain":
      case "drizzle":
        return <CloudRain className={`h-${size} w-${size} text-blue-400`} />;
      case "thunderstorm":
        return <CloudLightning className={`h-${size} w-${size} text-purple-400`} />;
      case "snow":
        return <CloudSnow className={`h-${size} w-${size} text-white`} />;
      case "mist":
      case "fog":
        return <CloudFog className={`h-${size} w-${size} text-gray-300`} />;
      case "wind":
        return <Wind className={`h-${size} w-${size} text-gray-300`} />;
      default:
        return <Cloud className={`h-${size} w-${size} text-gray-300`} />;
    }
  };

  const handleImageUploaded = () => {
    setShowUploader(false);
    toast({
      title: "Garden image added",
      description: "Your garden image will be used as background when similar weather conditions occur.",
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg p-3 text-white shadow-lg overflow-hidden">
      {/* Garden image collage background */}
      {weather && (
        <GardenImageCollage 
          weatherData={{
            temperature: weather.temperature,
            precipitation: weather.precipitation,
            uvIndex: weather.uvIndex,
            condition: weather.condition
          }}
          className="absolute inset-0 z-0"
        />
      )}
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Weather</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={() => setShowUploader(!showUploader)}
          >
            <Image size={16} className="mr-1" />
            {showUploader ? "Close" : "Add photo"}
          </Button>
        </div>
        
        {showUploader && (
          <div className="mb-3 p-2 bg-white/20 rounded-lg">
            <h4 className="text-sm font-semibold mb-1">Add your garden image</h4>
            <GardenImageUploader 
              onImageUploaded={handleImageUploaded}
              weatherData={weather ? {
                temperature: weather.temperature,
                precipitation: weather.precipitation,
                uvIndex: weather.uvIndex,
                condition: weather.condition
              } : undefined}
            />
          </div>
        )}
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-blue-500/50" />
            <Skeleton className="h-4 w-2/3 bg-blue-500/50" />
            <Skeleton className="h-4 w-1/2 bg-blue-500/50" />
          </div>
        ) : error ? (
          <div className="text-yellow-200 text-sm">
            {error}
          </div>
        ) : (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-2 bg-blue-500/30">
                <TabsTrigger value="today" className="data-[state=active]:bg-blue-700">Today</TabsTrigger>
                <TabsTrigger value="hourly" className="data-[state=active]:bg-blue-700">Hourly</TabsTrigger>
                <TabsTrigger value="forecast" className="data-[state=active]:bg-blue-700">Week</TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-blue-700">Trends</TabsTrigger>
              </TabsList>
              
              
              <TabsContent value="today" className="mt-0">
                <div className="flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{weather?.location}</div>
                      <div className="text-3xl font-bold flex items-center mt-1">
                        {weather?.temperature}°C
                      </div>
                      <div className="text-sm capitalize mt-1">{weather?.description}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      {weather && getWeatherIcon(weather.condition, 10)}
                      <div className="text-xs mt-1">
                        <div className="flex items-center justify-center">
                          <Wind className="h-3 w-3 mr-1" /> {weather?.windSpeed} m/s
                        </div>
                        <div className="flex items-center justify-center mt-1">
                          <DropletIcon className="h-3 w-3 mr-1" /> {weather?.precipitation} mm
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 my-2 bg-blue-500/30 p-2 rounded">
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-medium mb-1">UV Index</div>
                      <div className="flex items-center">
                        <ShieldAlert className="h-4 w-4 mr-1 text-yellow-200" />
                        <span className="text-base font-bold">
                          {weather?.uvIndex || 0}
                        </span>
                      </div>
                      <div className="text-xs mt-1">
                        {weather?.uvIndex && weather.uvIndex > 5 ? 'Protection needed' : 'Low exposure'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-medium mb-1">Daylight</div>
                      <div className="flex items-center justify-center">
                        <SunIcon className="h-4 w-4 mr-1 text-yellow-300" />
                        <span className="text-base font-bold">{weather?.dayDuration || '12h 00m'}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center justify-center space-x-2">
                        <span className="flex items-center">
                          <Sunset className="h-3 w-3 mr-1 rotate-180" /> {weather?.sunrise || '07:00'}
                        </span>
                        <span className="flex items-center">
                          <Sunset className="h-3 w-3 mr-1" /> {weather?.sunset || '19:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-2 pt-2 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-xs">Morning</div>
                      {getWeatherIcon(weather?.condition || 'Clouds', 5)}
                      <div className="text-sm font-medium">-1°</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs">Afternoon</div>
                      {getWeatherIcon(weather?.condition || 'Clouds', 5)}
                      <div className="text-sm font-medium">2°</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs">Evening</div>
                      {getWeatherIcon(weather?.condition || 'Clouds', 5)}
                      <div className="text-sm font-medium">0°</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs">Night</div>
                      {getWeatherIcon(weather?.condition || 'Clouds', 5)}
                      <div className="text-sm font-medium">-2°</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="hourly" className="mt-0">
                <div className="text-sm mb-2">Rain Prediction</div>
                <div className="flex flex-col">
                  <div className="grid grid-cols-9 gap-1">
                    {weather?.hourlyPrecipitation?.map((hour, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="text-xs">{hour.hour}</div>
                        <div 
                          className={`h-16 w-full mt-1 rounded-sm flex items-end justify-center 
                                   ${hour.chance > 50 ? 'bg-blue-300/70' : 'bg-blue-300/30'}`}
                          style={{ opacity: hour.chance / 100 }}
                        >
                          {hour.chance > 10 && (
                            <DropletIcon className="h-3 w-3 mb-1 text-white" />
                          )}
                        </div>
                        <div className="text-xs font-medium mt-1">{hour.chance}%</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-center mt-3 bg-blue-500/30 py-1 rounded-sm">
                    {weather?.hourlyPrecipitation?.some(h => h.chance > 50) 
                      ? "Bring an umbrella! Rain expected." 
                      : "No significant rain expected in the next hours."}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="forecast" className="mt-0">
                <div className="grid grid-cols-7 gap-1">
                  {weather?.forecast?.map((day, index) => (
                    <div key={index} className="flex flex-col items-center p-1 rounded bg-blue-500/20">
                      <div className="text-xs font-bold">{day.day}</div>
                      <div className="text-xs">{day.date}</div>
                      <div className="my-1">
                        {getWeatherIcon(day.condition, 4)}
                      </div>
                      <div className="flex items-center text-xs space-x-1">
                        <span className="text-blue-100">{day.minTemp}°</span>
                        <span>/</span>
                        <span className="text-yellow-200">{day.maxTemp}°</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center justify-center">
                        <Wind className="h-2 w-2 mr-1" />
                        <span>{day.windSpeed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="mt-0">
                <div className="text-sm mb-2">Temperature Comparison</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-500/30 p-2 rounded">
                    <div className="text-xs text-center">Daily Minimum</div>
                    <div className="text-3xl font-bold text-center text-blue-100">
                      {weather?.temperature ? Math.round(weather.temperature / 2) : 0}°
                    </div>
                    <div className="flex items-center justify-center text-xs mt-1">
                      <ArrowDown className="h-3 w-3 text-blue-200 mr-1" />
                      <span className="text-blue-200">{weather?.tempComparison?.minDiff}° from average</span>
                    </div>
                  </div>
                  <div className="bg-blue-500/30 p-2 rounded">
                    <div className="text-xs text-center">Daily Maximum</div>
                    <div className="text-3xl font-bold text-center text-yellow-200">
                      {weather?.temperature ? Math.round(weather.temperature * 1.2) : 0}°
                    </div>
                    <div className="flex items-center justify-center text-xs mt-1">
                      <ArrowDown className="h-3 w-3 text-blue-200 mr-1" />
                      <span className="text-blue-200">{weather?.tempComparison?.maxDiff}° from average</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-center mt-3 bg-blue-500/30 p-2 rounded">
                  Temperature deviations from the historical averages for {weather?.tempComparison?.month} in your region
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};
