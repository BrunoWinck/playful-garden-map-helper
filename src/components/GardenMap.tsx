
import React, { useState, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Shovel, Move } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlantItem } from "@/lib/types";

// Define our item types for DnD
const ItemTypes = {
  PLANT: 'plant',
};

import {initialPlants} from "@/lib/data";

type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
  type?: string;
  placementType?: "free" | "slots";
  slotsLength?: number;
  slotsWidth?: number;
  heated?: boolean;
  artificialLight?: boolean;
  naturalLightPercentage?: number;
};

// Define a Garden Grid cell
interface CellProps {
  x: number;
  y: number;
  patchId: string;
  onDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  plantItem?: PlantItem;
  color?: string;
  isSlot?: boolean;
}

// Garden Grid Cell component
const Cell = ({ x, y, onDrop, plantItem, patchId, color = "bg-brown-100", isSlot = false }: CellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PLANT,
    drop: (item: PlantItem) => onDrop(item, x, y, patchId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`${isSlot ? 'w-10 h-10' : 'w-16 h-16'} border ${isSlot ? 'border-gray-400' : 'border-brown-400'} ${
        isOver ? "bg-green-200" : color
      } ${isSlot ? 'rounded' : 'rounded-md'} flex items-center justify-center transition-colors`}
    >
      {plantItem && (
        <div className="flex flex-col items-center">
          <span className={`${isSlot ? 'text-xl' : 'text-3xl'}`}>{plantItem.icon}</span>
          {!isSlot && <span className="text-xs text-green-800">{plantItem.name}</span>}
        </div>
      )}
    </div>
  );
};

// Draggable Plant component
const DraggablePlant = ({ plant }: { plant: PlantItem }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PLANT,
    item: plant,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white p-3 rounded-lg shadow-md cursor-move flex flex-col items-center ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="text-3xl mb-2">{plant.icon}</span>
      <span className="text-sm text-green-800">{plant.name}</span>
    </div>
  );
};

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

  // Load patches from Supabase
  useEffect(() => {
    const fetchPatches = async () => {
      try {
        const { data, error } = await supabase
          .from('patches')
          .select('*');
          
        if (error) throw error;
        
        // Format patches for our component
        const formattedPatches = data.map(patch => ({
          id: patch.id,
          name: patch.name,
          width: Number(patch.width),
          height: Number(patch.height),
          type: patch.type,
          // Map database column names to our front-end property names
          placementType: patch.placement_type || "free",
          slotsLength: patch.slots_length || 4,
          slotsWidth: patch.slots_width || 6,
          heated: patch.heated,
          artificialLight: patch.artificial_light,
          naturalLightPercentage: patch.natural_light_percentage
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
              { id: "patch-1", name: "Vegetable Patch", width: 3, height: 2, placementType: "free" },
              { id: "patch-2", name: "Herb Garden", width: 2, height: 2, placementType: "free" }
            ]);
          }
        } else {
          // Set default patches if nothing available
          setPatches([
            { id: "patch-1", name: "Vegetable Patch", width: 3, height: 2, placementType: "free" },
            { id: "patch-2", name: "Herb Garden", width: 2, height: 2, placementType: "free" }
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

  // Filter state for plants
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtered plants based on category and search term
  const filteredPlants = initialPlants.filter(plant => {
    const matchesCategory = categoryFilter ? plant.category === categoryFilter : true;
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Render a seed tray with slots
  const renderSeedTray = (patch: Patch, patchIndex: number) => {
    const slotsLength = patch.slotsLength || 4;
    const slotsWidth = patch.slotsWidth || 6;
    const color = patchColors[patchIndex % patchColors.length];
    
    return (
      <div className="bg-brown-200 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-green-800 flex items-center">
            <Move className="h-4 w-4 mr-1 text-green-600" />
            {patch.name} (Seed Tray)
          </h4>
          <span className="text-xs text-green-700">
            {slotsLength}×{slotsWidth} slots
          </span>
        </div>
        
        <div className="flex justify-center">
          <div 
            className="grid gap-1 bg-gray-100 p-2 rounded-md border-2 border-gray-300" 
            style={{ 
              gridTemplateColumns: `repeat(${slotsWidth}, 1fr)`,
              gridTemplateRows: `repeat(${slotsLength}, 1fr)`
            }}
          >
            {Array.from({ length: slotsLength }).map((_, y) =>
              Array.from({ length: slotsWidth }).map((_, x) => {
                // Find if there's a plant at this position
                const patchPlants = plantedItems[patch.id] || [];
                const plantItem = patchPlants.find(
                  plant => 
                    plant.position?.x === x && 
                    plant.position?.y === y && 
                    plant.position?.patchId === patch.id
                );
                
                return (
                  <Cell
                    key={`${patch.id}-${x}-${y}`}
                    x={x}
                    y={y}
                    patchId={patch.id}
                    onDrop={handleDrop}
                    plantItem={plantItem}
                    color={color}
                    isSlot={true}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a regular patch
  const renderRegularPatch = (patch: Patch, patchIndex: number) => {
    return (
      <div className="bg-brown-200 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-green-800 flex items-center">
            <Move className="h-4 w-4 mr-1 text-green-600" />
            {patch.name}
          </h4>
          <span className="text-xs text-green-700">
            {patch.width}×{patch.height}
          </span>
        </div>
        
        <div className="grid gap-1" style={{ 
          gridTemplateColumns: `repeat(${patch.width}, 1fr)`,
          gridTemplateRows: `repeat(${patch.height}, 1fr)`
        }}>
          {Array.from({ length: patch.height }).map((_, y) =>
            Array.from({ length: patch.width }).map((_, x) => {
              // Find if there's a plant at this position
              const patchPlants = plantedItems[patch.id] || [];
              const plantItem = patchPlants.find(
                plant => 
                  plant.position?.x === x && 
                  plant.position?.y === y && 
                  plant.position?.patchId === patch.id
              );
              
              return (
                <Cell
                  key={`${patch.id}-${x}-${y}`}
                  x={x}
                  y={y}
                  patchId={patch.id}
                  onDrop={handleDrop}
                  plantItem={plantItem}
                  color={patchColors[patchIndex % patchColors.length]}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-6">
        <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <Shovel className="mr-2 h-5 w-5 text-green-600" />
            Garden Patches
          </h3>
          
          <div className="space-y-6">
            {patches.map((patch, patchIndex) => (
              <div key={patch.id}>
                {patch.placementType === 'slots' 
                  ? renderSeedTray(patch, patchIndex)
                  : renderRegularPatch(patch, patchIndex)
                }
              </div>
            ))}
            
            {patches.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No patches yet. Add patches using the Patch Manager!
              </div>
            )}
          </div>
        </div>
        
        <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Available Plants</h3>
          
          <div className="mb-4 flex flex-wrap gap-2">
            <button 
              onClick={() => setCategoryFilter(null)} 
              className={`px-3 py-1 rounded-full text-sm ${!categoryFilter ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
            >
              All
            </button>
            <button 
              onClick={() => setCategoryFilter('vegetable')} 
              className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'vegetable' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
            >
              Vegetables
            </button>
            <button 
              onClick={() => setCategoryFilter('fruit')} 
              className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'fruit' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
            >
              Fruits
            </button>
            <button 
              onClick={() => setCategoryFilter('herb')} 
              className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'herb' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
            >
              Herbs
            </button>
            <button 
              onClick={() => setCategoryFilter('flower')} 
              className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'flower' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
            >
              Flowers
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
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
      </div>
    </DndProvider>
  );
};
