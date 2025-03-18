
import React, { useState } from "react";
import { PlantCatalog } from "./garden/PlantCatalog";
import { TemplateTrays } from "./garden/TemplateTrays";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AvailablePlants = () => {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="plants" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="trays">Trays</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plants">
          <PlantCatalog 
            categoryFilter={categoryFilter} 
            setCategoryFilter={setCategoryFilter} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
          />
        </TabsContent>
        
        <TabsContent value="trays">
          <TemplateTrays />
        </TabsContent>
      </Tabs>
    </div>
  );
};
