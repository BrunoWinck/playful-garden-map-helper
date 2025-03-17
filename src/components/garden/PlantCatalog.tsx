
import React from "react";
import { PlantItem } from "@/lib/types";
import { DraggablePlant } from "./DraggablePlant";
import { PlantFilter } from "./PlantFilter";

interface PlantCatalogProps {
  plants: PlantItem[];
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const PlantCatalog = ({ 
  plants, 
  categoryFilter, 
  setCategoryFilter, 
  searchTerm, 
  setSearchTerm 
}: PlantCatalogProps) => {
  // Filter plants based on category and search term
  const filteredPlants = plants.filter(plant => {
    const matchesCategory = categoryFilter ? plant.category === categoryFilter : true;
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-green-800 mb-3">Available Plants</h3>
      
      <PlantFilter 
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      
      <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-80 overflow-y-auto">
        {filteredPlants.length > 0 ? 
          filteredPlants.map((plant) => (
            <DraggablePlant key={plant.id} plant={plant} />
          )) : 
          <p className="text-center w-full py-8 text-gray-500">No plants match your search.</p>
        }
      </div>
    </div>
  );
};
