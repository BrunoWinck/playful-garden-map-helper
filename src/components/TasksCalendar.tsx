
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sun, Moon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import type { CareTask } from "@/lib/types";

interface TasksCalendarProps {
  careTasks: CareTask[];
  calendarView: string;
  setCalendarView: (view: string) => void;
  dateRange: Date[];
  getTasksForDate: (date: Date) => CareTask[];
  getWeatherForDate: (date: Date) => any;
  isWithinForecastRange: (date: Date) => boolean;
  renderWeatherIcon: (condition: string) => JSX.Element;
}

export const TasksCalendar: React.FC<TasksCalendarProps> = ({
  careTasks,
  calendarView,
  setCalendarView,
  dateRange,
  getTasksForDate,
  getWeatherForDate,
  isWithinForecastRange,
  renderWeatherIcon
}) => (
  <div className="space-y-4">
    <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as any)}>
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="twoWeeks">2 Weeks</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
      
      <TabsContent value={calendarView} className="mt-4">
        <div className="grid grid-cols-1 gap-3">
          {dateRange.map((day, index) => {
            const tasksForDay = getTasksForDate(day);
            const weather = getWeatherForDate(day);
            const isActualForecast = isWithinForecastRange(day);
            
            return (
              <Card key={index} className={isSameDay(day, new Date()) ? 'border-green-500' : ''}>
                <CardHeader className="py-2 px-4 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {format(day, "EEEE")}
                    </CardTitle>
                    <CardDescription>
                      {format(day, "MMMM d")}
                    </CardDescription>
                  </div>
                  {weather && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          {renderWeatherIcon(weather.condition)}
                          <span className="ml-1 font-medium">{weather.temperature}°C</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {isActualForecast ? 'Forecast' : 'Climate avg'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-xs text-gray-500">
                        <div className="flex items-center">
                          <Sun className="h-3 w-3 text-yellow-500 mr-1" />
                          {weather.sunrise}
                        </div>
                        <div className="flex items-center">
                          <Moon className="h-3 w-3 text-blue-900 mr-1" />
                          {weather.sunset}
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="py-2 px-4">
                  {tasksForDay.length > 0 ? (
                    <div className="space-y-2">
                      {tasksForDay.map((task) => (
                        <div 
                          key={task.id}
                          className="flex items-center p-2 rounded-md bg-green-50 border border-green-100"
                        >
                          <Checkbox
                            id={`cal-task-${task.id}`}
                            checked={task.completed}
                            className="mr-2"
                          />
                          <div>
                            <label
                              htmlFor={`cal-task-${task.id}`}
                              className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-green-800'}`}
                            >
                              {task.task}
                            </label>
                            <div className="text-xs text-gray-500">
                              {task.plant}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 py-1">No tasks</div>
                  )}
                  
                  {weather && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                      <div>
                        {weather.condition} 
                        {weather.precipitation > 0 && `, ${weather.precipitation}mm`}
                      </div>
                      <div>{weather.daylightHours}h daylight</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  </div>
);
