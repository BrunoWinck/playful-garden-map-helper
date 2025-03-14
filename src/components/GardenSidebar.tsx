
import React from "react";
import { WeatherWidget } from "./WeatherWidget";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Leaf, Calendar, Settings, TreeDeciduous, Flower, Cloud, Map, Shovel } from "lucide-react";

export const GardenSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center gap-2 px-4 py-3">
        <TreeDeciduous className="h-6 w-6 text-green-100" />
        <h2 className="text-2xl font-bold text-white">Garden Planner</h2>
        <div className="flex-1" />
        <SidebarTrigger />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Garden Map">
              <Map className="h-5 w-5" />
              <span>Garden Map</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Plants">
              <Leaf className="h-5 w-5" />
              <span>Plants</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Seeds">
              <Flower className="h-5 w-5" />
              <span>Seeds</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Tools">
              <Shovel className="h-5 w-5" />
              <span>Tools</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Schedule">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Climate">
              <Cloud className="h-5 w-5" />
              <span>Climate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-green-700">
        <WeatherWidget />
      </SidebarFooter>
    </Sidebar>
  );
};
