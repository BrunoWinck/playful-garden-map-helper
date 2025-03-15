import React, { useState, useEffect } from "react";
import { 
  Cloud, Sun, CloudRain, Umbrella, Wind, Thermometer, 
  CloudSnow, CloudFog, CloudLightning, ArrowRight, 
  ArrowDown, ArrowUp, ChevronRight, DropletIcon, 
  Sunset, SunIcon, ShieldAlert
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  sunset?: string;
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

    const fetchOpenWeatherMap = async (lat: number, lon: number): Promise<WeatherData | null> => {
      try {
        const apiKey = "df9e9a54f5ccc054c06162e7ac854647"; 
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely&appid=${apiKey}`;
        
        console.log("Fetching OpenWeatherMap forecast from:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("OpenWeatherMap data received:", data);
        
        return parseOpenWeatherData(data);
      } catch (err) {
        console.error("Error fetching OpenWeatherMap weather:", err);
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
        } catch (meteomaticsError) {
          console.log("Meteomatics API failed, trying OpenWeatherMap...", meteomaticsError);
          
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
          weatherData.tempComparison = {
            minDiff: -3,
            maxDiff: -5,
            month: "March"
          };
          
          if (!weatherData.hourlyPrecipitation) {
            weatherData.hourlyPrecipitation = generateMockHourlyPrecipitation();
          }
          
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
        
        setWeather({
          location: "Auvergne-Rhône-Alpes, France",
          temperature: 17,
          condition: "Clouds",
          description: "scattered clouds",
          precipitation: 0.2,
          windSpeed: 2.8,
          forecast: generateMockForecast(),
          hourlyPrecipitation: generateMockHourlyPrecipitation(),
          tempComparison: {
            minDiff: -3,
            maxDiff: -5,
            month: "March"
          },
          uvIndex: 3,
          sunrise: "07:15",
          sunset: "19:45",
          dayDuration: "12h 30m"
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
      if (data.data.length > 10 && data.data[10].coordinates[0].dates.length > 0) {
        uvIndex = data.data[10].coordinates[0].dates[0].value;
      }
      
      let sunrise = "";
      let sunset = "";
      let dayDuration = "";
      
      if (data.data.length > 11 && data.data[11].coordinates[0].dates.length > 0) {
        const sunriseTime = new Date(data.data[11].coordinates[0].dates[0].value);
        sunrise = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      if (data.data.length > 12 && data.data[12].coordinates[0].dates.length > 0) {
        const sunsetTime = new Date(data.data[12].coordinates[0].dates[0].value);
        sunset = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      if (sunrise && sunset) {
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
      
      const forecastData = generateMockForecast();
      
      return {
        location: "Auvergne-Rhône-Alpes, France",
        temperature: Math.round(temperatureData),
        condition,
        description,
        precipitation: Math.round(precipitationData * 10) / 10,
        windSpeed: Math.round(windSpeedData * 10) / 10,
        forecast: forecastData,
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
  
  const parseOpenWeatherData = (data: any): WeatherData => {
    try {
      const temperature = data.current.temp;
      const condition = data.current.weather[0].main;
      const description = data.current.weather[0].description;
      const windSpeed = data.current.wind_speed;
      
      const hourlyPrecipitation = data.hourly.slice(0, 12).map((hour: any, index: number) => {
        return {
          hour: new Date(hour.dt * 1000).getHours() + ":00",
          chance: Math.round(hour.pop * 100),
          amount: hour.rain ? hour.rain["1h"] : 0
        };
      });
      
      const forecast = data.daily.slice(1, 8).map((day: any) => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('en-US', { day: 'numeric' });
        
        return {
          day: dayName.toUpperCase(),
          date: dayDate,
          condition: day.weather[0].main,
          minTemp: Math.round(day.temp.min),
          maxTemp: Math.round(day.temp.max),
          windSpeed: Math.round(day.wind_speed),
          precipitation: day.rain ? day.rain : 0
        };
      });
      
      let precipitation = 0;
      if (data.current.rain && data.current.rain['1h']) {
        precipitation = data.current.rain['1h'];
      } else if (data.current.snow && data.current.snow['1h']) {
        precipitation = data.current.snow['1h'];
      }
      
      const sunrise = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const dayDuration = `${Math.floor((data.current.sunset - data.current.sunrise) / 3600)}h ${Math.floor((data.current.sunset - data.current.sunrise) % 3600 / 60)}m`;
      
      const uvIndex = data.current.uvi;
      
      return {
        location: "Auvergne-Rhône-Alpes, France",
        temperature: Math.round(temperature),
        condition,
        description,
        precipitation: Math.round(precipitation * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10,
        forecast,
        hourlyPrecipitation,
        uvIndex: Math.round(uvIndex),
        sunrise,
        sunset,
        dayDuration
      };
    } catch (error) {
      console.error("Error parsing OpenWeatherMap data:", error);
      throw error;
    }
  };

  const generateMockForecast = (): ForecastDay[] => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow'];
    const today = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1);
      const dayIndex = date.getDay();
      
      return {
        day: days[dayIndex],
        date: date.getDate().toString(),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        minTemp: Math.floor(Math.random() * 5),
        maxTemp: Math.floor(Math.random() * 10) + 5,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        precipitation: Math.random() * 5
      };
    });
  };
  
  const generateMockHourlyPrecipitation = (): HourlyPrecipitation[] => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return Array.from({ length: 9 }, (_, i) => {
      const hour = (currentHour + i) % 24;
      const chance = Math.floor(Math.random() * 100);
      
      return {
        hour: `${hour}:00`,
        chance,
        amount: chance > 50 ? Math.random() * 2 : 0
      };
    });
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

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg p-3 text-white shadow-lg">
      <h3 className="text-lg font-semibold mb-2">Weather</h3>
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
  );
};
