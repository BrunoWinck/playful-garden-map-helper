
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
        
        <ResizablePanelGroup direction="horizontal" className="min-h-[500px] rounded-lg border">
          <ResizablePanel defaultSize={65}>
            <div className="bg-white rounded-lg shadow-md p-4 h-full">
              <h2 className="text-xl font-semibold text-green-700 mb-4">Garden Map</h2>
              <p className="text-green-700 mb-4">Drag plants onto your garden patches!</p>
              <GardenMap />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={35}>
            <div className="flex flex-col h-full gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 flex-1">
                <h2 className="text-xl font-semibold text-green-700 mb-4">Patch Manager</h2>
                <PatchManager />
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 flex-1">
                <h2 className="text-xl font-semibold text-green-700 mb-4">Care Schedule</h2>
                <CareSchedule />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};
