
import React from "react";
import { Move } from "lucide-react";
import { PlantItem, Patch } from "@/lib/types";
import { GardenCell } from "./GardenCell";

interface SeedTrayProps {
  patch: Patch;
  patchIndex: number;
  plantedItems: Record<string, PlantItem[]>;
  handleDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  handleMovePlant?: (plantItem: PlantItem, sourceX: number, sourceY: number, sourcePatchId: string, targetX: number, targetY: number, targetPatchId: string) => void;
  patchColors: string[];
  onGrowPlant: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant: (plantItem: PlantItem) => void;
  onCopyPlant: (plantItem: PlantItem, count: number) => void;
}

export const SeedTray = ({ 
  patch, 
  patchIndex, 
  plantedItems, 
  handleDrop, 
  handleMovePlant,
  patchColors,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}: SeedTrayProps) => {
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
                <GardenCell
                  key={`${patch.id}-${x}-${y}`}
                  x={x}
                  y={y}
                  patchId={patch.id}
                  patchType={patch.type}
                  onDrop={handleDrop}
                  onMovePlant={handleMovePlant}
                  plantItem={plantItem}
                  color={color}
                  isSlot={true}
                  onGrowPlant={onGrowPlant}
                  onDeletePlant={onDeletePlant}
                  onCopyPlant={onCopyPlant}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
