
import React from "react";
import { Patch } from "@/lib/types";
import { RegularPatch } from "./RegularPatch";
import { SeedTray } from "./SeedTray";

interface PatchContainerProps {
  patch: Patch;
  patchIndex: number;
  plantedItems: Record<string, any[]>;
  handleDrop: (item: any, x: number, y: number, patchId: string) => void;
  patchColors: string[];
}

export const PatchContainer = ({ 
  patch, 
  patchIndex, 
  plantedItems, 
  handleDrop, 
  patchColors 
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
          />
        : <RegularPatch 
            patch={patch} 
            patchIndex={patchIndex} 
            plantedItems={plantedItems} 
            handleDrop={handleDrop} 
            patchColors={patchColors} 
          />
      }
    </div>
  );
};
