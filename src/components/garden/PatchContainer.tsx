
import React from "react";
import { Patch, PlantItem } from "@/lib/types";
import { RegularPatch } from "./RegularPatch";
import { SeedTray } from "./SeedTray";

interface PatchContainerProps {
  patch: Patch;
  patchIndex: number;
  plantedItems: Record<string, PlantItem[]>;
  handleDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  patchColors: string[];
  onGrowPlant: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant: (plantItem: PlantItem) => void;
  onCopyPlant: (plantItem: PlantItem, count: number) => void;
}

export const PatchContainer = ({ 
  patch, 
  patchIndex, 
  plantedItems, 
  handleDrop, 
  patchColors,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}: PatchContainerProps) => {
  return (
    <div key={patch.id}>
      {patch.placementType === 'slots' 
        ? <SeedTray 
            patch={patch} 
            patchIndex={patchIndex} 
            plantedItems={plantedItems} 
            handleDrop={handleDrop} 
            patchColors={patchColors}
            onGrowPlant={onGrowPlant}
            onDeletePlant={onDeletePlant}
            onCopyPlant={onCopyPlant}
          />
        : <RegularPatch 
            patch={patch} 
            patchIndex={patchIndex} 
            plantedItems={plantedItems} 
            handleDrop={handleDrop} 
            patchColors={patchColors}
            onGrowPlant={onGrowPlant}
            onDeletePlant={onDeletePlant}
            onCopyPlant={onCopyPlant}
          />
      }
    </div>
  );
};
