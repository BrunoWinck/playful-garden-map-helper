
import React from "react";
import { GardenMap } from "./GardenMap";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PatchManager } from "./PatchManager";
import { WeatherWidget } from "./WeatherWidget";
import { GardenAdvisor } from "./GardenAdvisor";
import { GlossaryPanel } from "./GlossaryPanel";
import { NasaSatelliteView } from "./NasaSatelliteView";
import { GardenNavbar } from "./GardenNavbar";
import { WidgetHeader } from "./WidgetHeader";
import { TaskList } from "./TaskList";
import { TaskCalendar } from "./TaskCalendar";
import { ScrollArea } from "./ui/scroll-area";
import { Map, Leaf, ListTodo, Calendar } from "lucide-react";

export const GardenDashboard = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-green-50">
      <div className="max-w-7xl mx-auto p-4">
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
          <div className="md:col-span-2">
            <div className="h-[500px]">
              <GardenAdvisor />
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="h-[500px]">
              <GlossaryPanel />
            </div>
          </div>
        </div>
        
        {/* Tasks List and Calendar - Match the height of Garden Advisor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md h-[500px] flex flex-col">
              <WidgetHeader title="Garden Tasks" icon={ListTodo} />
              <div className="p-4 flex-1 overflow-hidden">
                <TaskList />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-lg shadow-md h-[500px] flex flex-col">
            <WidgetHeader title="Care Calendar" icon={Calendar} />
            <div className="p-4 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <TaskCalendar />
              </ScrollArea>
            </div>
          </div>
        </div>
        
        {/* Garden Map and Patch Manager - Set same fixed height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md h-[500px] flex flex-col">
            <WidgetHeader title="Garden Map" icon={Map} />
            <div className="p-4 flex-1 overflow-hidden">
              <p className="text-green-700 mb-4">Drag plants onto your garden patches!</p>
              <div className="h-[calc(100%-2rem)] overflow-auto">
                <GardenMap />
              </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md h-[500px] flex flex-col">
              <WidgetHeader title="Patch Manager" icon={Leaf} />
              <div className="p-4 flex-1 overflow-auto">
                <PatchManager />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
