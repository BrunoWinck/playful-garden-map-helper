
import React from "react";
import { Shovel } from "lucide-react";
import { Patch, PlantItem } from "@/lib/types";
import { PatchContainer } from "./PatchContainer";

interface GardenPatchesProps {
  patches: Patch[];
  plantedItems: Record<string, PlantItem[]>;
  handleDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  patchColors: string[];
}

export const GardenPatches = ({ 
  patches, 
  plantedItems, 
  handleDrop, 
  patchColors 
}: GardenPatchesProps) => {
  return (
    <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
        <Shovel className="mr-2 h-5 w-5 text-green-600" />
        Garden Patches
      </h3>
      
      <div className="space-y-6">
        {patches.map((patch, patchIndex) => (
          <PatchContainer
            key={patch.id}
            patch={patch}
            patchIndex={patchIndex}
            plantedItems={plantedItems}
            handleDrop={handleDrop}
            patchColors={patchColors}
          />
        ))}
        
        {patches.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No patches yet. Add patches using the Patch Manager!
          </div>
        )}
      </div>
    </div>
  );
};
