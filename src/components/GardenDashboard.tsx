
import React from "react";
import { GardenSidebar } from "./GardenSidebar";
import { GardenMap } from "./GardenMap";
import { CareSchedule } from "./CareSchedule";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatchManager } from "./PatchManager";
import { WeatherWidget } from "./WeatherWidget";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

export const GardenDashboard = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full">
        <GardenSidebar />
        <main className="flex-1 overflow-y-auto bg-green-50">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-green-800">Your Playful Garden</h1>
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                      Garden Map
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                      Greenhouses
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                      Schedule
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg mb-6 border border-green-200">
              <p className="text-green-800">
                <strong>New!</strong> Check out our Seedling Mini Greenhouses in the Greenhouses section. Perfect for starting your seeds indoors!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-3">
                <WeatherWidget />
              </div>
              <div className="md:col-span-1">
                <div className="bg-green-700 rounded-lg p-3 text-white h-full">
                  <h3 className="text-lg font-semibold mb-2">Garden Tips</h3>
                  <p className="text-sm">Based on the current weather, today is ideal for watering your tomato plants and harvesting mature lettuce.</p>
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
      </div>
    </SidebarProvider>
  );
};
