
import React from "react";
import { GardenDashboard } from "@/components/GardenDashboard";
import { GardenSidebar } from "@/components/GardenSidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-green-50 flex h-screen overflow-hidden w-full">
      <GardenSidebar />
      <GardenDashboard />
    </div>
  );
};

export default Index;
