
import React from "react";
import { Link } from "react-router-dom";
import { GardenSidebar } from "./GardenSidebar";
import { GardenMap } from "./GardenMap";
import { CareSchedule } from "./CareSchedule";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatchManager } from "./PatchManager";
import { WeatherWidget } from "./WeatherWidget";
import { GardenAdvisor } from "./GardenAdvisor";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

export const GardenDashboard = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden w-full">
        <GardenSidebar />
        <main className="flex-1 overflow-y-auto bg-green-50">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-green-800">Your Playful Garden</h1>
              
              <div className="flex items-center gap-4">
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
                
                <Link to="/settings">
                  <Button variant="outline" size="icon" className="rounded-full bg-white" title="Settings">
                    <Settings className="h-5 w-5 text-green-700" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Enhanced Weather Widget with full width */}
            <div className="mb-4">
              <WeatherWidget />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <GardenAdvisor />
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
