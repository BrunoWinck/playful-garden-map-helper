
import React from "react";
import { GardenSidebar } from "./GardenSidebar";
import { GardenMap } from "./GardenMap";
import { CareSchedule } from "./CareSchedule";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatchManager } from "./PatchManager";

export const GardenDashboard = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full">
        <GardenSidebar />
        <main className="flex-1 overflow-y-auto bg-green-50">
          <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-green-800 mb-6">Your Playful Garden</h1>
            
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
      </div>
    </SidebarProvider>
  );
};
