
import React from "react";
import { PlantCatalog } from "./garden/PlantCatalog";

export const AvailablePlants = () => {
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div className="h-full flex flex-col">
      <PlantCatalog 
        categoryFilter={categoryFilter} 
        setCategoryFilter={setCategoryFilter} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />
    </div>
  );
};
