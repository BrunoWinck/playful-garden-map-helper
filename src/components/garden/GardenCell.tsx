
import React from "react";
import { useDrop } from "react-dnd";
import { PlantItem, PlantGrowthStage, PatchType } from "@/lib/types";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArrowUp, ArrowDown, Trash, Copy, List } from "lucide-react";

// Define our item types for DnD
export const ItemTypes = {
  PLANT: 'plant',
};

const growthStageColors = {
  seed: "bg-yellow-50 text-yellow-700 border-yellow-200",
  sprout: "bg-green-50 text-green-700 border-green-200",
  young: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ready: "bg-blue-50 text-blue-800 border-blue-200",
  mature: "bg-purple-50 text-purple-800 border-purple-200"
};

// Define a Garden Grid cell
interface CellProps {
  x: number;
  y: number;
  patchId: string;
  patchType?: PatchType;
  onDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  plantItem?: PlantItem;
  color?: string;
  isSlot?: boolean;
  onGrowPlant?: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant?: (plantItem: PlantItem) => void;
  onCopyPlant?: (plantItem: PlantItem, count: number) => void;
}

export const GardenCell = ({ 
  x, 
  y, 
  onDrop, 
  plantItem, 
  patchId, 
  patchType = "outdoor-soil",
  color = "bg-brown-100", 
  isSlot = false,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
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

  const getStageIcon = (stage?: PlantGrowthStage) => {
    if (!stage) return null;
    
    return (
      <span className={`text-[8px] px-1 mt-0.5 rounded-full border ${growthStageColors[stage]}`}>
        {stage}
      </span>
    );
  };

  // If there's no plant, just render the cell
  if (!plantItem) {
    return (
      <div
        ref={drop}
        className={`${isSlot ? 'w-10 h-10' : 'w-16 h-16'} border ${isSlot ? 'border-gray-400' : 'border-brown-400'} ${
          isOver ? "bg-green-200" : color
        } ${isSlot ? 'rounded' : 'rounded-md'} flex items-center justify-center transition-colors`}
      />
    );
  }

  // If there's a plant, render it with a context menu
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={drop}
          className={`${isSlot ? 'w-10 h-10' : 'w-16 h-16'} border ${isSlot ? 'border-gray-400' : 'border-brown-400'} ${
            isOver ? "bg-green-200" : color
          } ${isSlot ? 'rounded' : 'rounded-md'} flex items-center justify-center transition-colors cursor-pointer`}
        >
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
                {getStageIcon(plantItem.stage)}
              </>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem 
          onClick={() => onGrowPlant && onGrowPlant(plantItem, "up")}
          disabled={plantItem.stage === "mature"}
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          Grow plant
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => onGrowPlant && onGrowPlant(plantItem, "down")}
          disabled={plantItem.stage === "seed"}
        >
          <ArrowDown className="mr-2 h-4 w-4" />
          Fix growth (go back)
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={() => onCopyPlant && onCopyPlant(plantItem, 1)}>
          <Copy className="mr-2 h-4 w-4" />
          Make 1 copy (total: 2)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onCopyPlant && onCopyPlant(plantItem, 3)}>
          <List className="mr-2 h-4 w-4" />
          Make 3 copies (total: 4)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onCopyPlant && onCopyPlant(plantItem, 5)}>
          <List className="mr-2 h-4 w-4" />
          Make 5 copies (total: 6)
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onCopyPlant && onCopyPlant(plantItem, 11)}>
          <List className="mr-2 h-4 w-4" />
          Make 11 copies (total: 12)
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={() => onDeletePlant && onDeletePlant(plantItem)}
          className="text-red-500 focus:text-red-500"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete plant
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
