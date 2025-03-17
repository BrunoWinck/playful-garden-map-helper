
import React from "react";
import { useDrop } from "react-dnd";
import { PlantItem } from "@/lib/types";

// Define our item types for DnD
export const ItemTypes = {
  PLANT: 'plant',
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

export const GardenCell = ({ 
  x, 
  y, 
  onDrop, 
  plantItem, 
  patchId, 
  color = "bg-brown-100", 
  isSlot = false 
}: CellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PLANT,
    drop: (item: PlantItem) => onDrop(item, x, y, patchId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const getLifecycleBadgeColor = (lifecycle: string | undefined) => {
    if (!lifecycle) return '';
    
    switch (lifecycle) {
      case 'tree':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'perennial':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'bush':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rhizome':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
          {!isSlot && (
            <>
              <span className="text-xs text-green-800">{plantItem.name}</span>
              {plantItem.lifecycle && !isSlot && (
                <span className={`text-[8px] px-1 mt-0.5 rounded-full border ${getLifecycleBadgeColor(plantItem.lifecycle)}`}>
                  {plantItem.lifecycle}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
