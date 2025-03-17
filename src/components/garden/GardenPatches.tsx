
import React from "react";
import { Patch, PlantItem } from "@/lib/types";
import { RegularPatch } from "./RegularPatch";
import { SeedTray } from "./SeedTray";

interface GardenPatchesProps {
  patches: Patch[];
  plantedItems: Record<string, PlantItem[]>;
  handleDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  patchColors: string[];
  onGrowPlant: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant: (plantItem: PlantItem) => void;
  onCopyPlant: (plantItem: PlantItem, count: number) => void;
}

export const GardenPatches: React.FC<GardenPatchesProps> = ({ 
  patches, 
  plantedItems, 
  handleDrop, 
  patchColors,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patches.map((patch, index) => 
        patch.placementType === "slots" ? (
          <SeedTray
            key={patch.id}
            patch={patch}
            patchIndex={index}
            plantedItems={plantedItems}
            handleDrop={handleDrop}
            patchColors={patchColors}
            onGrowPlant={onGrowPlant}
            onDeletePlant={onDeletePlant}
            onCopyPlant={onCopyPlant}
          />
        ) : (
          <RegularPatch
            key={patch.id}
            patch={patch}
            patchIndex={index}
            plantedItems={plantedItems}
            handleDrop={handleDrop}
            patchColors={patchColors}
            onGrowPlant={onGrowPlant}
            onDeletePlant={onDeletePlant}
            onCopyPlant={onCopyPlant}
          />
        )
      )}
    </div>
  );
};
