import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlantItem, Patch, PatchType, PlacementType } from "@/lib/types";
import { GardenPatches } from "./garden/GardenPatches";
import { PlantCatalog } from "./garden/PlantCatalog";
import { Skeleton } from "./ui/skeleton";
import { fetchPatches } from "@/services/patchService";

// Colors for different patches
const patchColors = [
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-rose-50",
];

export const GardenMap = () => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [plantedItems, setPlantedItems] = useState<Record<string, PlantItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter state for plants
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load patches directly using the service
  useEffect(() => {
    const loadPatches = async () => {
      setIsLoading(true);
      try {
        const patchesData = await fetchPatches();
        setPatches(patchesData);
        
        // Also store in localStorage for other components that might rely on it
        localStorage.setItem('garden-patches', JSON.stringify(patchesData));
      } catch (error) {
        console.error("Error fetching patches:", error);
        toast.error("Failed to load garden patches");
        
        // Fallback to localStorage if available
        const storedPatches = localStorage.getItem('garden-patches');
        if (storedPatches) {
          try {
            setPatches(JSON.parse(storedPatches));
          } catch (e) {
            console.error("Error parsing stored patches:", e);
            // Set default patches if all else fails
            setPatches([
              { 
                id: "patch-1", 
                name: "Vegetable Patch", 
                width: 3, 
                height: 2, 
                length: 3,
                type: "outdoor-soil", 
                placementType: "free",
                slotsLength: 4,
                slotsWidth: 6,
                heated: false,
                artificialLight: false,
                naturalLightPercentage: 100
              },
              { 
                id: "patch-2", 
                name: "Herb Garden", 
                width: 2, 
                height: 2, 
                length: 2,
                type: "outdoor-soil", 
                placementType: "free",
                slotsLength: 4,
                slotsWidth: 6,
                heated: false,
                artificialLight: false,
                naturalLightPercentage: 100
              }
            ]);
          }
        } else {
          // Set default patches if nothing available
          setPatches([
            { 
              id: "patch-1", 
              name: "Vegetable Patch", 
              width: 3, 
              height: 2, 
              length: 3,
              type: "outdoor-soil", 
              placementType: "free",
              slotsLength: 4,
              slotsWidth: 6,
              heated: false,
              artificialLight: false,
              naturalLightPercentage: 100
            },
            { 
              id: "patch-2", 
              name: "Herb Garden", 
              width: 2, 
              height: 2, 
              length: 2,
              type: "outdoor-soil", 
              placementType: "free",
              slotsLength: 4,
              slotsWidth: 6,
              heated: false,
              artificialLight: false,
              naturalLightPercentage: 100
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatches();

    // Set up a listener for local storage updates from PatchManager
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'garden-patches' && e.newValue) {
        try {
          const updatedPatches = JSON.parse(e.newValue);
          setPatches(updatedPatches);
        } catch (error) {
          console.error("Error parsing patches from localStorage:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Load planted items
  useEffect(() => {
    const fetchPlantedItems = async () => {
      try {
        const { data, error } = await supabase
          .from('planted_items')
          .select(`
            id, 
            position_x, 
            position_y, 
            patch_id,
            plants (*)
          `);
          
        if (error) throw error;
        
        const plantedItemsByPatch: Record<string, PlantItem[]> = {};
        
        data.forEach(item => {
          const patchId = item.patch_id;
          if (!plantedItemsByPatch[patchId]) {
            plantedItemsByPatch[patchId] = [];
          }
          
          const plant = item.plants;
          plantedItemsByPatch[patchId].push({
            id: plant.id,
            name: plant.name,
            icon: plant.icon,
            category: plant.category,
            parent_id: plant.parent_id,
            position: {
              x: item.position_x,
              y: item.position_y,
              patchId: patchId
            }
          });
        });
        
        setPlantedItems(plantedItemsByPatch);
        
        // Also store in localStorage as backup
        localStorage.setItem('garden-planted-items', JSON.stringify(plantedItemsByPatch));
      } catch (error) {
        console.error("Error fetching planted items:", error);
        
        // Fall back to localStorage
        const storedPlantedItems = localStorage.getItem('garden-planted-items');
        if (storedPlantedItems) {
          try {
            setPlantedItems(JSON.parse(storedPlantedItems));
          } catch (e) {
            console.error("Error loading planted items:", e);
          }
        }
      }
    };
    
    // Try to load from database first
    fetchPlantedItems();
  }, []);
  
  // Save planted items when they change
  useEffect(() => {
    if (Object.keys(plantedItems).length > 0) {
      localStorage.setItem('garden-planted-items', JSON.stringify(plantedItems));
    }
  }, [plantedItems]);

  // Handle plant drop on a grid cell
  const handleDrop = async (item: PlantItem, x: number, y: number, patchId: string) => {
    // Create a new plant item with position
    const plantedItem: PlantItem = {
      ...item,
      position: { x, y, patchId },
    };
    
    // Add to the planted items for this patch
    setPlantedItems(prev => {
      const patchPlants = prev[patchId] || [];
      
      // Check if there's already a plant at this position
      const existingPlantIndex = patchPlants.findIndex(
        plant => plant.position?.x === x && plant.position?.y === y
      );
      
      let updatedPlants;
      if (existingPlantIndex >= 0) {
        // Replace the existing plant
        updatedPlants = [...patchPlants];
        updatedPlants[existingPlantIndex] = plantedItem;
      } else {
        // Add a new plant
        updatedPlants = [...patchPlants, plantedItem];
      }
      
      return {
        ...prev,
        [patchId]: updatedPlants
      };
    });
    
    // Save to database
    try {
      // Check if there's already a plant at this position in the database
      const { data: existingItems, error: checkError } = await supabase
        .from('planted_items')
        .select('id')
        .eq('patch_id', patchId)
        .eq('position_x', x)
        .eq('position_y', y);
        
      if (checkError) throw checkError;
      
      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('planted_items')
          .update({ plant_id: item.id })
          .eq('id', existingItems[0].id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from('planted_items')
          .insert({
            plant_id: item.id,
            patch_id: patchId,
            position_x: x,
            position_y: y
          });
          
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error saving planted item to database:", error);
      toast.error("Failed to save plant placement");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-6">
        <GardenPatches 
          patches={patches} 
          plantedItems={plantedItems} 
          handleDrop={handleDrop} 
          patchColors={patchColors} 
        />
        
        <PlantCatalog 
          categoryFilter={categoryFilter} 
          setCategoryFilter={setCategoryFilter} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </div>
    </DndProvider>
  );
};
