
import React from "react";
import { WeatherWidget } from "./WeatherWidget";
import { Button } from "@/components/ui/button";
import { Leaf, Calendar, Settings, TreeDeciduous, Flower, Cloud } from "lucide-react";

export const GardenSidebar = () => {
  return (
    <div className="w-64 bg-green-800 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-green-700 flex items-center gap-2">
        <TreeDeciduous className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Garden Planner</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-700">
              <Leaf className="mr-2 h-5 w-5" />
              Plants
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-700">
              <Flower className="mr-2 h-5 w-5" />
              Seeds
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-700">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-700">
              <Cloud className="mr-2 h-5 w-5" />
              Climate
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-green-700">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-green-700">
        <WeatherWidget />
      </div>
    </div>
  );
};
