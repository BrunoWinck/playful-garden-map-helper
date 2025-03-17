
import React, { useEffect, useState } from "react";
import { PlantItem } from "@/lib/types";
import { DraggablePlant } from "./DraggablePlant";
import { PlantFilter } from "./PlantFilter";
import { fetchPlants } from "@/services/plantService";
import { initialPlants } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

interface PlantCatalogProps {
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const PlantCatalog = ({ 
  categoryFilter, 
  setCategoryFilter, 
  searchTerm, 
  setSearchTerm 
}: PlantCatalogProps) => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load plants from database
  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const dbPlants = await fetchPlants();
      if (dbPlants && dbPlants.length > 0) {
        setPlants(dbPlants);
      } else {
        // Fallback to initial plants if database fetch fails
        setPlants(initialPlants);
      }
    } catch (error) {
      console.error("Error loading plants:", error);
      setPlants(initialPlants);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPlants();
  }, []);
  
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
        {isLoading ? (
          Array(8).fill(0).map((_, index) => (
            <div key={index} className="flex flex-col items-center w-20">
              <Skeleton className="w-12 h-12 rounded-full mb-2" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))
        ) : filteredPlants.length > 0 ? (
          filteredPlants.map((plant) => (
            <DraggablePlant 
              key={plant.id} 
              plant={plant} 
              onPlantUpdated={loadPlants} 
            />
          ))
        ) : (
          <p className="text-center w-full py-8 text-gray-500">No plants match your search.</p>
        )}
      </div>
    </div>
  );
};
