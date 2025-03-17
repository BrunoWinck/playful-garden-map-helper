
import React from "react";
import { GardenMap } from "./GardenMap";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WeatherWidget } from "./WeatherWidget";
import { GardenAdvisor } from "./GardenAdvisor";
import { GlossaryPanel } from "./GlossaryPanel";
import { NasaSatelliteView } from "./NasaSatelliteView";
import { GardenNavbar } from "./GardenNavbar";
import { TaskList } from "./TaskList";
import { TaskCalendar } from "./TaskCalendar";
import { ScrollArea } from "./ui/scroll-area";
import { Map, Leaf, ListTodo, Calendar } from "lucide-react";
import { AvailablePlants } from "./AvailablePlants";
import { Widget } from "./Widget";

export const GardenDashboard = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-green-50">
      <div className="max-w-7xl mx-auto p-4 pb-[200px]"> {/* Added 200px padding at the bottom */}
        <GardenNavbar />
        
        {/* Weather and Satellite View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <WeatherWidget />
          </div>
          <div className="md:col-span-1">
            <NasaSatelliteView />
          </div>
        </div>
        
        {/* Garden Advisor and Glossary - Set a fixed height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <GardenAdvisor />
          <div className="md:col-span-1">
            <div className="h-[500px]">
              <GlossaryPanel />
            </div>
          </div>
        </div>
        
        {/* Tasks List and Calendar - Restore TaskList to the left of Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <Widget
              title="Task List"
              icon={ListTodo}
              col="md:col-span-1"
              height="h-[500px]"
            >
              <div className="p-4 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <TaskList />
                </ScrollArea>
              </div>
            </Widget>
          </div>
          <div className="md:col-span-2">
            <Widget
              title="Care Calendar"
              icon={Calendar}
              col="md:col-span-2"
              height="h-[500px]"
            >
              <div className="p-4 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <TaskCalendar />
                </ScrollArea>
              </div>
            </Widget>
          </div>
        </div>
        
        {/* Garden Map and Available Plants - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <Widget
              title="Garden Map"
              icon={Map}
              col="md:col-span-2"
              height="h-[600px]"
            >
              <div className="p-4 flex-1 overflow-hidden">
                <div className="h-[calc(100%-2rem)] overflow-auto" id="garden-map-container">
                  <GardenMap />
                </div>
              </div>
            </Widget>
          </div>
          <div className="md:col-span-1">
            <Widget
              title="Available Plants"
              icon={Leaf}
              col="md:col-span-1"
              height="h-[600px]"
            >
              <div className="p-4 flex-1 overflow-auto">
                <AvailablePlants />
              </div>
            </Widget>
          </div>
        </div>
      </div>
    </main>
  );
};
