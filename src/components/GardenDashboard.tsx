
import React from "react";
import { GardenSidebar } from "./GardenSidebar";
import { GardenMap } from "./GardenMap";
import { CareSchedule } from "./CareSchedule";

export const GardenDashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <GardenSidebar />
      <main className="flex-1 overflow-y-auto p-4 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-green-800 mb-6">Your Playful Garden</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-xl font-semibold text-green-700 mb-4">Garden Map</h2>
                <p className="text-green-700 mb-4">Drag plants from the palette below and drop them onto the garden grid!</p>
                <GardenMap />
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold text-green-700 mb-4">Care Schedule</h2>
                <CareSchedule />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
