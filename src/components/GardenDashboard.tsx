
import React from "react";
import { GardenMap } from "./GardenMap";
import { CareSchedule } from "./CareSchedule";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PatchManager } from "./PatchManager";
import { WeatherWidget } from "./WeatherWidget";
import { GardenAdvisor } from "./GardenAdvisor";
import { GlossaryPanel } from "./GlossaryPanel";
import { NasaSatelliteView } from "./NasaSatelliteView";
import { GardenNavbar } from "./GardenNavbar";

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
        
        {/* Garden Advisor and Glossary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="h-full">
              <GardenAdvisor />
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="h-full">
              <GlossaryPanel />
            </div>
          </div>
        </div>
        
        {/* Garden Map and Patch Manager - Updated to match 2/3 and 1/3 ratio with gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 h-full">
              <div className="bg-green-700 text-white rounded-lg py-3 px-4 mb-4">
                <h2 className="text-xl font-semibold">Garden Map</h2>
              </div>
              <p className="text-green-700 mb-4">Drag plants onto your garden patches!</p>
              <GardenMap />
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="flex flex-col h-full gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 flex-1">
                <div className="bg-green-700 text-white rounded-lg py-3 px-4 mb-4">
                  <h2 className="text-xl font-semibold">Patch Manager</h2>
                </div>
                <PatchManager />
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 flex-1">
                <div className="bg-green-700 text-white rounded-lg py-3 px-4 mb-4">
                  <h2 className="text-xl font-semibold">Care Schedule</h2>
                </div>
                <CareSchedule />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
