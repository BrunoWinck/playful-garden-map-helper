
import React from "react";
import { GardenDashboard } from "@/components/GardenDashboard";
import { GardenSidebar } from "@/components/GardenSidebar";
import { Layout } from "@/components/Layout";

const Index = () => {
  return (
    <div className="min-h-screen bg-green-50">
      <Layout>
        <GardenSidebar />
        <GardenDashboard />
      </Layout>
    </div>
  );
};

export default Index;
