
import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { PlantItem } from "@/lib/types";
import { ItemTypes } from "./GardenCell";
import { useLongPress } from "@/utils/useLongPress";
import { AddVarietyDialog } from "./AddVarietyDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { deletePlant, hasVarieties } from "@/services/plantService";
import { toast } from "sonner";

interface DraggablePlantProps {
  plant: PlantItem;
  onPlantUpdated: () => void;
}

export const DraggablePlant = ({ plant, onPlantUpdated }: DraggablePlantProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PLANT,
    item: plant,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [isVarietyDialogOpen, setIsVarietyDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasChildVarieties, setHasChildVarieties] = useState(false);

  // Check if the plant has varieties when component mounts
  useEffect(() => {
    if (!plant.parent_id) { // Only check for parent plants
      const checkVarieties = async () => {
        const hasChildVarieties = await hasVarieties(plant.id);
        setHasChildVarieties(hasChildVarieties);
      };
      checkVarieties();
    }
  }, [plant.id, plant.parent_id]);

  const handleAddVariety = () => {
    setIsMenuOpen(false);
    setIsVarietyDialogOpen(true);
  };

  const handleDeletePlant = async () => {
    setIsMenuOpen(false);
    const success = await deletePlant(plant.id);
    if (success) {
      onPlantUpdated();
    }
  };

  const longPressProps = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
    onClick: () => {},
  });

  const getBadgeColor = (lifecycle: string | undefined) => {
    switch (lifecycle) {
      case 'tree':
        return 'bg-amber-100 text-amber-800';
      case 'perennial':
        return 'bg-emerald-100 text-emerald-800';
      case 'bush':
        return 'bg-purple-100 text-purple-800';
      case 'rhizome':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // A parent plant can be deleted only if it has no varieties
  // A variety (plant with parent_id) can always be deleted
  const canDelete = plant.parent_id || (!hasChildVarieties);

  return (
    <>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <div
            ref={drag}
            className="relative flex flex-col items-center cursor-move p-2 hover:bg-brown-300 rounded-lg transition-colors"
            style={{
              opacity: isDragging ? 0.5 : 1,
            }}
            {...longPressProps}
          >
            <div className="absolute top-0 right-0 flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full bg-green-100" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddVariety();
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-full bg-red-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlant();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="text-3xl mb-1">{plant.icon}</div>
            <div className="text-xs text-center">{plant.name}</div>
            {plant.lifecycle && (
              <div className={`text-[10px] px-1.5 mt-1 rounded-full ${getBadgeColor(plant.lifecycle)}`}>
                {plant.lifecycle}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={handleAddVariety}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variety
            </Button>
            {canDelete && (
              <Button 
                variant="outline" 
                className="justify-start text-destructive hover:text-destructive"
                onClick={handleDeletePlant}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Plant
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AddVarietyDialog
        isOpen={isVarietyDialogOpen}
        onClose={() => setIsVarietyDialogOpen(false)}
        plant={plant}
        onVarietyAdded={onPlantUpdated}
      />
    </>
  );
};
