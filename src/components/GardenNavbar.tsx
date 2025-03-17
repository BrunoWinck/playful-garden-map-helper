
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Map, Home, Calendar, Moon, Sun } from "lucide-react";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu";
import { Toggle } from "@/components/ui/toggle";

export const GardenNavbar = () => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-3xl font-bold text-green-800">Your Playful Garden</h1>
      
      <div className="flex items-center gap-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                <Map className="h-4 w-4 mr-2" />
                Garden Map
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                <Home className="h-4 w-4 mr-2" />
                Greenhouses
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button (non-functional) */}
          <Toggle variant="outline" className="rounded-full bg-white border-green-200" aria-label="Toggle theme">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-green-700 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-green-700 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Toggle>
          
          <Link to="/settings">
            <Button variant="outline" size="icon" className="rounded-full bg-white" title="Settings">
              <Settings className="h-5 w-5 text-green-700" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
