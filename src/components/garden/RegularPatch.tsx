
import React from "react";
import { Move } from "lucide-react";
import { PlantItem, Patch } from "@/lib/types";
import { GardenCell } from "./GardenCell";

interface RegularPatchProps {
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

export const RegularPatch = ({ 
  patch, 
  patchIndex, 
  plantedItems, 
  handleDrop, 
  handleMovePlant,
  patchColors,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}: RegularPatchProps) => {
  // Calculate the relative width of the container based on the patch length
  // Using 10 meters = 100% width as the reference
  const containerWidth = Math.min((patch.length / 10) * 100, 100);
  
  return (
    <div className="bg-brown-200 p-3 rounded-lg" style={{ width: `${containerWidth}%` }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-green-800 flex items-center">
          <Move className="h-4 w-4 mr-1 text-green-600" />
          {patch.name}
        </h4>
        <span className="text-xs text-green-700">
          {patch.length}×{patch.width} m
        </span>
      </div>
      
      <div className="grid gap-0.5" style={{ 
        gridTemplateColumns: `repeat(${patch.width}, 1fr)`,
        gridTemplateRows: `repeat(${patch.length}, 1fr)`
      }}>
        {Array.from({ length: patch.length }).map((_, y) =>
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
              <GardenCell
                key={`${patch.id}-${x}-${y}`}
                x={x}
                y={y}
                patchId={patch.id}
                patchType={patch.type}
                onDrop={handleDrop}
                onMovePlant={handleMovePlant}
                plantItem={plantItem}
                color={patchColors[patchIndex % patchColors.length]}
                onGrowPlant={onGrowPlant}
                onDeletePlant={onDeletePlant}
                onCopyPlant={onCopyPlant}
                isFreePlacement={patch.placementType === "free"}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
