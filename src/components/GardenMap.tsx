
import React, { useState, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Shovel, Move } from "lucide-react";

// Define our item types for DnD
const ItemTypes = {
  PLANT: 'plant',
};

type PlantItem = {
  id: string;
  name: string;
  icon: string;
  position?: { x: number; y: number; patchId?: string };
};

type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
};

// Define a Garden Grid cell
interface CellProps {
  x: number;
  y: number;
  patchId: string;
  onDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  plantItem?: PlantItem;
  color?: string;
}

// Garden Grid Cell component
const Cell = ({ x, y, onDrop, plantItem, patchId, color = "bg-brown-100" }: CellProps) => {
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
      className={`w-16 h-16 border border-brown-400 ${
        isOver ? "bg-green-200" : color
      } rounded-md flex items-center justify-center transition-colors`}
    >
      {plantItem && (
        <div className="flex flex-col items-center">
          <span className="text-3xl">{plantItem.icon}</span>
          <span className="text-xs text-green-800">{plantItem.name}</span>
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

const initialPlants: PlantItem[] = [
  { id: "tomato", name: "Tomato", icon: "🍅" },
  { id: "carrot", name: "Carrot", icon: "🥕" },
  { id: "lettuce", name: "Lettuce", icon: "🥬" },
  { id: "potato", name: "Potato", icon: "🥔" },
  { id: "cucumber", name: "Cucumber", icon: "🥒" },
  { id: "pepper", name: "Pepper", icon: "🫑" },
  { id: "corn", name: "Corn", icon: "🌽" },
  { id: "eggplant", name: "Eggplant", icon: "🍆" },
];

// Colors for different patches
const patchColors = [
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-rose-50",
];

export const GardenMap = () => {
  // Default patches
  const [patches, setPatches] = useState<Patch[]>([
    { id: "patch-1", name: "Vegetable Patch", width: 3, height: 2 },
    { id: "patch-2", name: "Herb Garden", width: 2, height: 2 }
  ]);
  
  // Load patches from localStorage if available
  useEffect(() => {
    const storedPatches = localStorage.getItem('garden-patches');
    if (storedPatches) {
      try {
        setPatches(JSON.parse(storedPatches));
      } catch (e) {
        console.error("Error loading patches:", e);
      }
    }
  }, []);
  
  // Save patches to localStorage when they change
  useEffect(() => {
    localStorage.setItem('garden-patches', JSON.stringify(patches));
  }, [patches]);
  
  // Track planted items in each patch
  const [plantedItems, setPlantedItems] = useState<Record<string, PlantItem[]>>({});
  
  // Load planted items from localStorage if available
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
    localStorage.setItem('garden-planted-items', JSON.stringify(plantedItems));
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
              <div key={patch.id} className="bg-brown-200 p-3 rounded-lg">
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
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg">
            {initialPlants.map((plant) => (
              <DraggablePlant key={plant.id} plant={plant} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
