
import React from "react";
import { useDrop, useDrag } from "react-dnd";
import { PlantItem, PlantGrowthStage, PatchType } from "@/lib/types";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArrowUp, ArrowDown, Trash, Copy, List, Move } from "lucide-react";

// Define our item types for DnD
export const ItemTypes = {
  PLANT: 'plant',
  PLANTED_ITEM: 'planted_item',
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
  onMovePlant?: (plantItem: PlantItem, sourceX: number, sourceY: number, sourcePatchId: string, targetX: number, targetY: number, targetPatchId: string) => void;
  plantItem?: PlantItem;
  color?: string;
  isSlot?: boolean;
  isFreePlacement?: boolean;
  onGrowPlant?: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant?: (plantItem: PlantItem) => void;
  onCopyPlant?: (plantItem: PlantItem, count: number) => void;
}

export const GardenCell = ({ 
  x, 
  y, 
  onDrop, 
  onMovePlant,
  plantItem, 
  patchId, 
  patchType = "outdoor-soil",
  color = "bg-brown-100", 
  isSlot = false,
  isFreePlacement = false,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}: CellProps) => {
  // Set up drop for both new plants and existing plants
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.PLANT, ItemTypes.PLANTED_ITEM],
    drop: (item: any, monitor) => {
      if (item.position) {
        // This is a planted item being moved
        if (onMovePlant) {
          onMovePlant(
            item, 
            item.position.x, 
            item.position.y, 
            item.position.patchId, 
            x, 
            y, 
            patchId
          );
        }
      } else {
        // This is a new plant from the catalog
        onDrop(item, x, y, patchId);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Set up drag for plants already in the garden
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.PLANTED_ITEM,
    item: plantItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !!plantItem, // Only allow dragging if there's a plant
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

  // Use smaller cells for free placement patches to allow plants to be packed closer together
  const cellSizeClass = isFreePlacement 
    ? (isSlot ? 'w-8 h-8' : 'w-12 h-12') 
    : (isSlot ? 'w-10 h-10' : 'w-16 h-16');

  // If there's no plant, just render the cell
  if (!plantItem) {
    return (
      <div
        ref={drop}
        className={`${cellSizeClass} border ${isSlot ? 'border-gray-400' : 'border-brown-400'} ${
          isOver ? "bg-green-200" : color
        } ${isSlot ? 'rounded' : 'rounded-md'} flex items-center justify-center transition-colors`}
      />
    );
  }

  // If there's a plant, render it with a context menu and make it draggable
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={preview}
          className={`${cellSizeClass} border ${isSlot ? 'border-gray-400' : 'border-brown-400'} ${
            isOver ? "bg-green-200" : color
          } ${isDragging ? "opacity-40" : ""} ${isSlot ? 'rounded' : 'rounded-md'} flex items-center justify-center transition-colors cursor-move`}
        >
          <div 
            ref={(node) => {
              // Connect both drag and drop refs
              drop(node);
              drag(node);
            }}
            className="flex flex-col items-center w-full h-full justify-center"
          >
            <span className={`${isSlot || isFreePlacement ? 'text-xl' : 'text-3xl'}`}>{plantItem.icon}</span>
            {!(isSlot || isFreePlacement) && (
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
            {isFreePlacement && (
              <span className="text-[8px] text-green-800">{plantItem.name.substring(0, 6)}</span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem className="cursor-move">
          <Move className="mr-2 h-4 w-4" />
          Drag to move plant
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
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
