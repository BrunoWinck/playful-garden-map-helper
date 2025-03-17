import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlantItem, Patch, PatchType, PlacementType } from "@/lib/types";
import { initialPlants } from "@/lib/data";
import { GardenPatches } from "./garden/GardenPatches";
import { PlantCatalog } from "./garden/PlantCatalog";
import { Skeleton } from "./ui/skeleton";

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

  // Load patches from Supabase
  useEffect(() => {
    const fetchPatches = async () => {
      try {
        const { data, error } = await supabase
          .from('patches')
          .select('*');
          
        if (error) throw error;
        
        // Format patches for our component
        const formattedPatches: Patch[] = data.map(patch => ({
          id: patch.id,
          name: patch.name,
          width: Number(patch.width),
          height: Number(patch.height),
          length: Number(patch.width), // Map width to length for backward compatibility
          type: patch.type as PatchType,
          placementType: (patch.placement_type as PlacementType) || "free",
          slotsLength: patch.slots_length || 4,
          slotsWidth: patch.slots_width || 6,
          heated: patch.heated || false,
          artificialLight: patch.artificial_light || false,
          naturalLightPercentage: patch.natural_light_percentage || 100
        }));
        
        setPatches(formattedPatches);
        
        // Also store in localStorage for other components that might rely on it
        localStorage.setItem('garden-patches', JSON.stringify(formattedPatches));
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
    
    fetchPatches();
  }, []);
  
  // Track planted items in each patch
  useEffect(() => {
    const storedPlantedItems = localStorage.getItem('garden-planted-items');
    if (storedPlantedItems) {
      try {
        setPlantedItems(JSON.parse(storedPlantedItems));
      } catch (e) {
        console.error("Error loading planted items:", e);
      }
    }
  }, []);
  
  // Save planted items to localStorage when they change
  useEffect(() => {
    if (Object.keys(plantedItems).length > 0) {
      localStorage.setItem('garden-planted-items', JSON.stringify(plantedItems));
    }
  }, [plantedItems]);

  // Handle plant drop on a grid cell
  const handleDrop = (item: PlantItem, x: number, y: number, patchId: string) => {
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
      
      if (existingPlantIndex >= 0) {
        // Replace the existing plant
        const updatedPlants = [...patchPlants];
        updatedPlants[existingPlantIndex] = plantedItem;
        return {
          ...prev,
          [patchId]: updatedPlants
        };
      } else {
        // Add a new plant
        return {
          ...prev,
          [patchId]: [...patchPlants, plantedItem]
        };
      }
    });
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
          plants={initialPlants} 
          categoryFilter={categoryFilter} 
          setCategoryFilter={setCategoryFilter} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
      </div>
    </DndProvider>
  );
};
