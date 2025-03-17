
import React from "react";
import { PlantCatalog } from "./garden/PlantCatalog";
import { WidgetHeader } from "./WidgetHeader";
import { Leaf } from "lucide-react";

export const AvailablePlants = () => {
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <WidgetHeader title="Available Plants" icon={Leaf} />
      <div className="p-4 flex-1 overflow-auto">
        <PlantCatalog 
          categoryFilter={categoryFilter} 
          setCategoryFilter={setCategoryFilter} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </div>
    </div>
  );
};
