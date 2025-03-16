
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, List, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sun, Moon, CloudRain, Cloud } from "lucide-react";

import { TasksContent } from "@/components/TasksContent.tsx";
import { TasksCalendar } from "@/components/TasksCalendar.tsx";


// Mock weather data - in a real app, this would come from an API
type WeatherForecast = {
  date: Date;
  temperature: number;
  condition: string;
  precipitation: number;
  sunrise: string;
  sunset: string;
  daylightHours: number;
};

import { careTasks } from "@/lib/mockData.ts";

// Generate mock weather forecasts for the next 30 days
const generateWeatherForecasts = (): WeatherForecast[] => {
  const forecasts: WeatherForecast[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = addDays(currentDate, i);
    const isRainy = Math.random() > 0.7;
    const isCloudy = Math.random() > 0.5;
    
    // Summer-like conditions if within 7 days (actual forecast),
    // climate averages beyond that
    const isWithinWeek = i < 7;
    const baseTempVariation = isWithinWeek ? Math.random() * 8 - 4 : 0; // +/- 4 degrees for actual forecast
    const tempDay = Math.floor(isWithinWeek ? 24 + baseTempVariation : 22 + Math.sin(i/14 * Math.PI) * 3);
    
    // Calculate daylight hours (longer in summer, shorter in winter)
    // This is simplified - real calculations would be more complex and location-based
    const baseHours = 12; // average daylight hours
    const seasonalVariation = Math.sin((date.getMonth() + date.getDate()/30) / 12 * 2 * Math.PI) * 3;
    const daylightHours = baseHours + seasonalVariation;
    
    // Set sunrise and sunset based on daylight hours
    const sunriseHour = Math.floor((24 - daylightHours) / 2);
    const sunsetHour = Math.floor(sunriseHour + daylightHours);
    
    forecasts.push({
      date,
      temperature: tempDay,
      condition: isRainy ? "Rain" : (isCloudy ? "Cloudy" : "Sunny"),
      precipitation: isRainy ? Math.floor(Math.random() * 15) : 0,
      sunrise: `${sunriseHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      sunset: `${sunsetHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      daylightHours: parseFloat(daylightHours.toFixed(1))
    });
  }
  
  return forecasts;
};

const weatherForecasts = generateWeatherForecasts();

export const CareSchedule = () => {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarView, setCalendarView] = useState<"week" | "twoWeeks" | "month">("week");
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  // Helper function to get the date range based on the current view
  const getDateRange = () => {
    const today = new Date();
    
    switch(calendarView) {
      case "week":
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
      case "twoWeeks":
        const twoWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: twoWeekStart, end: addDays(twoWeekStart, 13) });
      case "month":
      default:
        // Get roughly 4 weeks (28 days)
        const monthStart = startOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: monthStart, end: addDays(monthStart, 27) });
    }
  };

  const dateRange = getDateRange();
  
  // Filter tasks for the current date range
  const getTasksForDate = (date: Date) => {
    return careTasks.filter(task => 
      task.date && isSameDay(task.date, date)
    );
  };
  
  // Get weather for a specific date
  const getWeatherForDate = (date: Date) => {
    return weatherForecasts.find(forecast => 
      isSameDay(forecast.date, date)
    );
  };
  
  // Render the weather icon based on condition
  const renderWeatherIcon = (condition: string) => {
    switch(condition.toLowerCase()) {
      case "sunny":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "rain":
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      case "cloudy":
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Function to determine if a date is within the next 7 days (actual forecast)
  const isWithinForecastRange = (date: Date) => {
    const today = new Date();
    const forecastLimit = addDays(today, 7);
    return date <= forecastLimit;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-green-800">Tasks</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={viewMode === "list" ? "bg-green-100" : ""}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={viewMode === "calendar" ? "bg-green-100" : ""}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendar
          </Button>
          
          {viewMode === "calendar" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {calendarView === "week" ? "Week" : 
                   calendarView === "twoWeeks" ? "2 Weeks" : "Month"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCalendarView("week")}>
                  Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("twoWeeks")}>
                  2 Weeks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("month")}>
                  Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {format(date, "MMM dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                    setOpen(false);
                  }
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {(viewMode === "list") ? <TasksContent careTasks={careTasks}/> : 
      (viewMode === "calendar") ? <TasksCalendar/> : 
        ""

      }
    </div>
  );
};
