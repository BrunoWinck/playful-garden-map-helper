
import React from "react";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Leaf, 
  Calendar, 
  Settings, 
  TreeDeciduous, 
  Flower, 
  Cloud, 
  Map, 
  Shovel, 
  FlowerIcon, 
  LeafyGreen, 
  TreePalm,
  TreePine,
  Sprout,
  PanelRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const GardenSidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  
  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon"
      className="shadow-[4px_0px_8px_0px_rgba(0,0,0,0.15)]"
    >
      <SidebarHeader className="flex items-center gap-2 px-4 py-3 border-b border-green-700 bg-green-800">
        <TreeDeciduous className="h-6 w-6 text-green-100" />
        {state === "expanded" && (
          <h2 className="text-2xl font-bold text-white">Garden Planner</h2>
        )}
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="text-white hover:bg-green-700 hover:text-white"
          title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
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
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <LeafyGreen className="h-4 w-4" />
                  <span>Vegetables</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Flower className="h-4 w-4" />
                  <span>Flowers</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <TreePine className="h-4 w-4" />
                  <span>Trees</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Sprout className="h-4 w-4" />
                  <span>Herbs</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Greenhouses">
              <TreeDeciduous className="h-5 w-5" />
              <span>Greenhouses</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Sprout className="h-4 w-4" />
                  <span>Seedling Mini Greenhouses</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <TreePalm className="h-4 w-4" />
                  <span>Walk-in Greenhouses</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
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
      
      <SidebarFooter className="p-4 border-t border-green-700 bg-green-800">
        {state === "expanded" ? (
          <div className="text-center text-white">
            <p className="text-sm">Garden Planner v1.0</p>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            onClick={toggleSidebar} 
            className="w-full text-white hover:bg-green-700 hover:text-white flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
