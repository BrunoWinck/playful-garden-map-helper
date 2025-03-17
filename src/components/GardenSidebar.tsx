
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
      className="shadow-[2px_0px_5px_0px_rgba(0,0,0,0.07)]"
      style={{
        "--sidebar-width": "14rem",
        "--sidebar-width-icon": "2.75rem"
      } as React.CSSProperties}
    >
      <SidebarHeader className="flex items-center gap-2 px-3 py-2 border-b border-green-100/30 bg-green-700/90">
        <TreeDeciduous className="h-5 w-5 text-green-50" />
        {state === "expanded" && (
          <h2 className="text-xl font-medium text-white">Garden Planner</h2>
        )}
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="text-white hover:bg-green-600/60 hover:text-white h-6 w-6"
          title={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Garden Map" className="py-1.5">
              <Map className="h-4 w-4" />
              <span>Garden Map</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Plants" className="py-1.5">
              <Leaf className="h-4 w-4" />
              <span>Plants</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <LeafyGreen className="h-3.5 w-3.5" />
                  <span>Vegetables</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Flower className="h-3.5 w-3.5" />
                  <span>Flowers</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <TreePine className="h-3.5 w-3.5" />
                  <span>Trees</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Sprout className="h-3.5 w-3.5" />
                  <span>Herbs</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Greenhouses" className="py-1.5">
              <TreeDeciduous className="h-4 w-4" />
              <span>Greenhouses</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <Sprout className="h-3.5 w-3.5" />
                  <span>Seedling Mini Greenhouses</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <TreePalm className="h-3.5 w-3.5" />
                  <span>Walk-in Greenhouses</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Seeds" className="py-1.5">
              <Flower className="h-4 w-4" />
              <span>Seeds</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Tools" className="py-1.5">
              <Shovel className="h-4 w-4" />
              <span>Tools</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Schedule" className="py-1.5">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Climate" className="py-1.5">
              <Cloud className="h-4 w-4" />
              <span>Climate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" className="py-1.5">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-3 border-t border-green-100/30 bg-green-700/90">
        {state === "expanded" ? (
          <div className="text-center text-white">
            <p className="text-xs">Garden Planner v1.0</p>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            onClick={toggleSidebar} 
            className="w-full text-white hover:bg-green-600/60 hover:text-white flex items-center justify-center h-6"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
