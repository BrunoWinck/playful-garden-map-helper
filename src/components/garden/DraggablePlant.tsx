
import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { PlantItem } from "@/lib/types";
import { ItemTypes } from "./GardenCell";
import { useLongPress } from "@/utils/useLongPress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AddVarietyDialog } from "./AddVarietyDialog";
import { deletePlant, isPlantInUse } from "@/services/plantService";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

interface DraggablePlantProps {
  plant: PlantItem;
  onPlantUpdated?: () => void;
}

export const DraggablePlant = ({ plant, onPlantUpdated }: DraggablePlantProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PLANT,
    item: plant,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isAddVarietyOpen, setIsAddVarietyOpen] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Long press handler to open popover
  const longPressHandlers = useLongPress({
    onLongPress: () => setPopoverOpen(true),
  });
  
  const handleAddVariety = () => {
    setPopoverOpen(false);
    setIsAddVarietyOpen(true);
  };
  
  const handleDeletePlant = async () => {
    setPopoverOpen(false);
    
    // Check if plant is in use
    const inUse = await isPlantInUse(plant.id);
    if (inUse) {
      setIsDeleteDisabled(true);
      toast.error("Cannot delete a plant that is in use in your garden");
      return;
    }
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete "${plant.name}"?`)) {
      const success = await deletePlant(plant.id);
      if (success && onPlantUpdated) {
        onPlantUpdated();
      }
    }
  };
  
  const handleVarietyAdded = (newVariety: PlantItem) => {
    if (onPlantUpdated) {
      onPlantUpdated();
    }
  };

  return (
    <div className="relative">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            ref={drag}
            className={`bg-white p-3 rounded-lg shadow-md cursor-move flex flex-col items-center ${
              isDragging ? "opacity-50" : "opacity-100"
            }`}
            {...longPressHandlers}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="text-3xl mb-2">{plant.icon}</span>
            <span className="text-sm text-green-800">{plant.name}</span>
            
            {/* Add button - top right */}
            <button
              className={`absolute top-1 right-1 text-green-600 hover:text-green-800 transition-opacity ${
                isHovered ? "opacity-100" : "opacity-30"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddVariety();
              }}
              aria-label="Add variety"
            >
              <PlusCircle size={16} />
            </button>
            
            {/* Delete button - bottom right */}
            <button
              className={`absolute bottom-1 right-1 ${
                isDeleteDisabled ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:text-red-700"
              } transition-opacity ${isHovered ? "opacity-100" : "opacity-30"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDeleteDisabled) {
                  handleDeletePlant();
                }
              }}
              disabled={isDeleteDisabled}
              aria-label="Delete plant"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start" 
              onClick={handleAddVariety}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Variety
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50" 
              onClick={handleDeletePlant}
              disabled={isDeleteDisabled}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Plant
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      <AddVarietyDialog 
        isOpen={isAddVarietyOpen}
        onClose={() => setIsAddVarietyOpen(false)}
        plant={plant}
        onVarietyAdded={handleVarietyAdded}
      />
    </div>
  );
};
