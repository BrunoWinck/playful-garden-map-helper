import React, { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlantItem, Patch, PlantGrowthStage, PatchFormValues } from "@/lib/types";
import { GardenPatches } from "./garden/GardenPatches";
import { PlantCatalog } from "./garden/PlantCatalog";
import { Skeleton } from "./ui/skeleton";
import { fetchPatches } from "@/services/patchService";
import { eventBus, PATCH_EVENTS } from "@/lib/eventBus";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { PatchForm } from "./garden/PatchForm";
import { createPatch } from "@/services/patchService";

// Colors for different patches
const patchColors = [
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-rose-50",
];

// Growth stage progression
const growthStages: PlantGrowthStage[] = ["seed", "sprout", "young", "ready", "mature"];

// Get initial stage based on patch type
const getInitialStage = (patchType: string): PlantGrowthStage => {
  if (patchType === "indoor") {
    return "seed";
  }
  return "young";
};

// Get next or previous growth stage
const getNextStage = (currentStage: PlantGrowthStage, direction: "up" | "down"): PlantGrowthStage => {
  const currentIndex = growthStages.indexOf(currentStage);
  if (direction === "up" && currentIndex < growthStages.length - 1) {
    return growthStages[currentIndex + 1];
  } else if (direction === "down" && currentIndex > 0) {
    return growthStages[currentIndex - 1];
  }
  return currentStage;
};

export const GardenMap = () => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [plantedItems, setPlantedItems] = useState<Record<string, PlantItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddPatchOpen, setIsAddPatchOpen] = useState(false);
  
  // Ref for the container to auto-scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);

  // Filter state for plants
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load patches once at component init
  useEffect(() => {
    const loadPatches = async () => {
      setIsLoading(true);
      try {
        console.log("GardenMap: Fetching patches from service");
        const patchesData = await fetchPatches();
        console.log("GardenMap: Fetched patches:", patchesData.length);
        setPatches(patchesData);
      } catch (error) {
        console.error("Error fetching patches:", error);
        toast.error("Failed to load garden patches");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatches();
    
    // Set up event listeners for patch changes
    const handlePatchesUpdated = (updatedPatches: Patch[]) => {
      console.log("GardenMap: Received PATCHES_UPDATED event", updatedPatches.length);
      setPatches(updatedPatches);
    };
    
    const handlePatchAdded = (newPatch: Patch) => {
      console.log("GardenMap: Received PATCH_ADDED event", newPatch.name);
      setPatches(prev => [...prev, newPatch]);
    };
    
    const handlePatchDeleted = (patchId: string) => {
      console.log("GardenMap: Received PATCH_DELETED event", patchId);
      setPatches(prev => prev.filter(patch => patch.id !== patchId));
    };
    
    const handlePatchEdited = (editedPatch: Patch) => {
      console.log("GardenMap: Received PATCH_EDITED event", editedPatch.name);
      setPatches(prev => prev.map(patch => 
        patch.id === editedPatch.id ? editedPatch : patch
      ));
    };
    
    // Subscribe to events
    eventBus.on(PATCH_EVENTS.PATCHES_UPDATED, handlePatchesUpdated);
    eventBus.on(PATCH_EVENTS.PATCH_ADDED, handlePatchAdded);
    eventBus.on(PATCH_EVENTS.PATCH_DELETED, handlePatchDeleted);
    eventBus.on(PATCH_EVENTS.PATCH_EDITED, handlePatchEdited);
    
    // Cleanup event listeners
    return () => {
      eventBus.off(PATCH_EVENTS.PATCHES_UPDATED, handlePatchesUpdated);
      eventBus.off(PATCH_EVENTS.PATCH_ADDED, handlePatchAdded);
      eventBus.off(PATCH_EVENTS.PATCH_DELETED, handlePatchDeleted);
      eventBus.off(PATCH_EVENTS.PATCH_EDITED, handlePatchEdited);
    };
  }, []);

  // Set up auto-scroll functionality during drag operations
  useEffect(() => {
    const handleDragStart = () => {
      setIsDragging(true);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };

    // Handle mouse move during drag to determine auto-scroll direction and speed
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Define scroll zones at the top and bottom of the container
      const topScrollZone = 50; // pixels from top
      const bottomScrollZone = 50; // pixels from bottom
      
      // Calculate mouse position relative to container
      const mouseY = e.clientY;
      
      // Clear any existing interval first
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      
      // Determine if we need to scroll and in which direction
      if (mouseY < containerRect.top + topScrollZone) {
        // Scroll up when mouse is near the top
        autoScrollIntervalRef.current = window.setInterval(() => {
          container.scrollBy({ top: -10, behavior: 'auto' });
        }, 16); // ~60fps
      } else if (mouseY > containerRect.bottom - bottomScrollZone) {
        // Scroll down when mouse is near the bottom
        autoScrollIntervalRef.current = window.setInterval(() => {
          container.scrollBy({ top: 10, behavior: 'auto' });
        }, 16); // ~60fps
      }
    };

    // Add event listeners
    document.addEventListener('plantDragStart', handleDragStart);
    document.addEventListener('plantDragEnd', handleDragEnd);
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      document.removeEventListener('plantDragStart', handleDragStart);
      document.removeEventListener('plantDragEnd', handleDragEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (autoScrollIntervalRef.current !== null) {
        window.clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isDragging]);
  
  // Load planted items
  useEffect(() => {
    const fetchPlantedItems = async () => {
      try {
        const { data, error } = await supabase
          .from('planted_items')
          .select(`
            id, 
            position_x, 
            position_y, 
            patch_id,
            plants (*)
          `);
          
        if (error) throw error;
        
        const plantedItemsByPatch: Record<string, PlantItem[]> = {};
        
        data.forEach(item => {
          const patchId = item.patch_id;
          if (!plantedItemsByPatch[patchId]) {
            plantedItemsByPatch[patchId] = [];
          }
          
          const plant = item.plants;
          const matchingPatch = patches.find(p => p.id === patchId);
          
          plantedItemsByPatch[patchId].push({
            id: plant.id,
            name: plant.name,
            icon: plant.icon,
            category: plant.category,
            lifecycle: plant.lifecycle,
            parent_id: plant.parent_id,
            position: {
              x: item.position_x,
              y: item.position_y,
              patchId: patchId
            },
            stage: matchingPatch ? getInitialStage(matchingPatch.type) : "young"
          });
        });
        
        setPlantedItems(plantedItemsByPatch);
        
        // Also store in localStorage as backup
        localStorage.setItem('garden-planted-items', JSON.stringify(plantedItemsByPatch));
      } catch (error) {
        console.error("Error fetching planted items:", error);
        
        // Fall back to localStorage
        const storedPlantedItems = localStorage.getItem('garden-planted-items');
        if (storedPlantedItems) {
          try {
            setPlantedItems(JSON.parse(storedPlantedItems));
          } catch (e) {
            console.error("Error loading planted items:", e);
          }
        }
      }
    };
    
    // Try to load from database first
    fetchPlantedItems();
  }, [patches]);
  
  // Save planted items when they change
  useEffect(() => {
    if (Object.keys(plantedItems).length > 0) {
      localStorage.setItem('garden-planted-items', JSON.stringify(plantedItems));
    }
  }, [plantedItems]);

  // Handle plant drop on a grid cell
  const handleDrop = async (item: PlantItem, x: number, y: number, patchId: string) => {
    const matchingPatch = patches.find(p => p.id === patchId);
    if (!matchingPatch) {
      console.error("Could not find matching patch for id:", patchId);
      return;
    }

    // Create a new plant item with position and initial growth stage
    const initialStage = getInitialStage(matchingPatch.type);
    const plantedItem: PlantItem = {
      ...item,
      position: { x, y, patchId },
      stage: initialStage
    };
    
    // Add to the planted items for this patch
    setPlantedItems(prev => {
      const patchPlants = prev[patchId] || [];
      
      // Check if there's already a plant at this position
      const existingPlantIndex = patchPlants.findIndex(
        plant => plant.position?.x === x && plant.position?.y === y
      );
      
      let updatedPlants;
      if (existingPlantIndex >= 0) {
        // Replace the existing plant
        updatedPlants = [...patchPlants];
        updatedPlants[existingPlantIndex] = plantedItem;
      } else {
        // Add a new plant
        updatedPlants = [...patchPlants, plantedItem];
      }
      
      return {
        ...prev,
        [patchId]: updatedPlants
      };
    });
    
    // Save to database
    try {
      // Check if there's already a plant at this position in the database
      const { data: existingItems, error: checkError } = await supabase
        .from('planted_items')
        .select('id')
        .eq('patch_id', patchId)
        .eq('position_x', x)
        .eq('position_y', y);
        
      if (checkError) throw checkError;
      
      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('planted_items')
          .update({ 
            plant_id: item.id,
            stage: initialStage
          })
          .eq('id', existingItems[0].id);
          
        if (updateError) throw updateError;
      } else {
        // Insert new item
        const { error: insertError } = await supabase
          .from('planted_items')
          .insert({
            plant_id: item.id,
            patch_id: patchId,
            position_x: x,
            position_y: y,
            stage: initialStage
          });
          
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error saving planted item to database:", error);
      toast.error("Failed to save plant placement");
    }
  };

  // Handle growing a plant to next stage
  const handleGrowPlant = async (plantItem: PlantItem, direction: "up" | "down") => {
    if (!plantItem.position || !plantItem.stage) {
      console.error("Plant item is missing position or stage", plantItem);
      return;
    }

    const { x, y, patchId } = plantItem.position;
    if (!patchId) {
      console.error("Plant item is missing patchId", plantItem);
      return;
    }

    const newStage = getNextStage(plantItem.stage, direction);
    
    // Update local state
    setPlantedItems(prev => {
      const patchPlants = prev[patchId] || [];
      
      // Find the plant at this position
      const plantIndex = patchPlants.findIndex(
        plant => 
          plant.position?.x === x && 
          plant.position?.y === y &&
          plant.position?.patchId === patchId
      );
      
      if (plantIndex === -1) {
        console.error("Could not find plant at position", x, y, patchId);
        return prev;
      }
      
      // Create updated plant
      const updatedPlant = {
        ...patchPlants[plantIndex],
        stage: newStage
      };
      
      // Update plants array
      const updatedPlants = [...patchPlants];
      updatedPlants[plantIndex] = updatedPlant;
      
      return {
        ...prev,
        [patchId]: updatedPlants
      };
    });
    
    // Update the stage in the database
    try {
      const { error } = await supabase
        .from('planted_items')
        .update({
          stage: newStage
        })
        .eq('patch_id', patchId)
        .eq('position_x', x)
        .eq('position_y', y);
        
      if (error) throw error;
      
      toast.success(`Plant ${direction === "up" ? "grown" : "reverted"} to ${newStage} stage`);
    } catch (error) {
      console.error("Error updating plant stage:", error);
      toast.error("Failed to update plant stage");
    }
  };

  // Handle deleting a plant
  const handleDeletePlant = async (plantItem: PlantItem) => {
    if (!plantItem.position || !plantItem.position.patchId) {
      console.error("Plant item is missing position or patchId", plantItem);
      return;
    }

    const { x, y, patchId } = plantItem.position;
    
    // Update local state
    setPlantedItems(prev => {
      const patchPlants = prev[patchId] || [];
      
      // Filter out the plant at this position
      const updatedPlants = patchPlants.filter(
        plant => 
          !(plant.position?.x === x && 
            plant.position?.y === y &&
            plant.position?.patchId === patchId)
      );
      
      return {
        ...prev,
        [patchId]: updatedPlants
      };
    });
    
    // Delete from database
    try {
      const { error } = await supabase
        .from('planted_items')
        .delete()
        .eq('patch_id', patchId)
        .eq('position_x', x)
        .eq('position_y', y);
        
      if (error) throw error;
      
      toast.success("Plant removed from garden");
    } catch (error) {
      console.error("Error deleting plant:", error);
      toast.error("Failed to delete plant");
    }
  };

  // Handle copying a plant multiple times
  const handleCopyPlant = async (plantItem: PlantItem, count: number) => {
    if (!plantItem.position || !plantItem.position.patchId) {
      console.error("Plant item is missing position or patchId", plantItem);
      return;
    }

    const { patchId } = plantItem.position;
    const matchingPatch = patches.find(p => p.id === patchId);
    if (!matchingPatch) {
      console.error("Could not find matching patch for id:", patchId);
      return;
    }

    // For regular patches
    if (matchingPatch.placementType === "free") {
      const patchWidth = matchingPatch.width;
      const patchHeight = matchingPatch.height;
      
      // Find empty positions in the patch
      const patchPlants = plantedItems[patchId] || [];
      const occupiedPositions = new Set(
        patchPlants.map(plant => `${plant.position?.x}-${plant.position?.y}`)
      );
      
      const emptyPositions = [];
      for (let y = 0; y < patchHeight; y++) {
        for (let x = 0; x < patchWidth; x++) {
          const posKey = `${x}-${y}`;
          if (!occupiedPositions.has(posKey)) {
            emptyPositions.push({ x, y });
          }
        }
      }
      
      // Shuffle empty positions to randomize placement
      const shuffledPositions = emptyPositions.sort(() => Math.random() - 0.5);
      
      // Create copies with empty positions
      const copies = shuffledPositions
        .slice(0, count)
        .map(pos => ({
          ...plantItem,
          position: { x: pos.x, y: pos.y, patchId }
        }));
      
      // If we don't have enough empty spots
      if (copies.length < count) {
        toast.warning(`Only ${copies.length} empty spots available for copying`);
      }
      
      // Update local state
      if (copies.length > 0) {
        setPlantedItems(prev => {
          return {
            ...prev,
            [patchId]: [...(prev[patchId] || []), ...copies]
          };
        });
        
        // Save copies to database
        try {
          const copyData = copies.map(copy => ({
            plant_id: copy.id,
            patch_id: patchId,
            position_x: copy.position!.x,
            position_y: copy.position!.y,
            stage: copy.stage || plantItem.stage || 'young'
          }));
          
          const { error } = await supabase
            .from('planted_items')
            .insert(copyData);
            
          if (error) throw error;
          
          toast.success(`Created ${copies.length} copies of ${plantItem.name}`);
        } catch (error) {
          console.error("Error saving plant copies to database:", error);
          toast.error("Failed to save all plant copies");
        }
      }
    } else {
      // For seed trays (slots)
      const slotsLength = matchingPatch.slotsLength || 4;
      const slotsWidth = matchingPatch.slotsWidth || 6;
      
      // Similar logic as above but adapted for seed trays
      const patchPlants = plantedItems[patchId] || [];
      const occupiedPositions = new Set(
        patchPlants.map(plant => `${plant.position?.x}-${plant.position?.y}`)
      );
      
      const emptyPositions = [];
      for (let y = 0; y < slotsLength; y++) {
        for (let x = 0; x < slotsWidth; x++) {
          const posKey = `${x}-${y}`;
          if (!occupiedPositions.has(posKey)) {
            emptyPositions.push({ x, y });
          }
        }
      }
      
      const shuffledPositions = emptyPositions.sort(() => Math.random() - 0.5);
      
      const copies = shuffledPositions
        .slice(0, count)
        .map(pos => ({
          ...plantItem,
          position: { x: pos.x, y: pos.y, patchId }
        }));
      
      if (copies.length < count) {
        toast.warning(`Only ${copies.length} empty slots available for copying`);
      }
      
      if (copies.length > 0) {
        setPlantedItems(prev => {
          return {
            ...prev,
            [patchId]: [...(prev[patchId] || []), ...copies]
          };
        });
        
        try {
          const copyData = copies.map(copy => ({
            plant_id: copy.id,
            patch_id: patchId,
            position_x: copy.position!.x,
            position_y: copy.position!.y,
            stage: copy.stage || plantItem.stage || 'young'
          }));
          
          const { error } = await supabase
            .from('planted_items')
            .insert(copyData);
            
          if (error) throw error;
          
          toast.success(`Created ${copies.length} copies of ${plantItem.name}`);
        } catch (error) {
          console.error("Error saving plant copies to database:", error);
          toast.error("Failed to save all plant copies");
        }
      }
    }
  };

  // Handle adding a new patch
  const handleAddPatch = async (data: PatchFormValues) => {
    try {
      console.log("Creating new patch with data:", data);
      const newPatch = await createPatch(data);
      console.log("New patch created:", newPatch);
      
      setPatches(prev => [...prev, newPatch]);
      toast.success(`Added new patch: ${newPatch.name}`);
      
      // Emit event for new patch
      console.log("GardenMap: Emitting PATCH_ADDED event");
      eventBus.emit(PATCH_EVENTS.PATCH_ADDED, newPatch);
      
      // Close the popover
      setIsAddPatchOpen(false);
    } catch (error) {
      console.error("Error adding patch:", error);
      toast.error("Failed to add patch");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-6" ref={containerRef}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-green-700">Drag plants onto your garden patches!</p>
          <Popover open={isAddPatchOpen} onOpenChange={setIsAddPatchOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-1 h-4 w-4" /> Add Patch
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="p-2">
                <h3 className="text-lg font-semibold mb-3">Create New Patch</h3>
                <PatchForm 
                  onSubmit={handleAddPatch}
                  isEditing={false}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <GardenPatches 
          patches={patches} 
          plantedItems={plantedItems} 
          handleDrop={handleDrop} 
          patchColors={patchColors} 
          onGrowPlant={handleGrowPlant}
          onDeletePlant={handleDeletePlant}
          onCopyPlant={handleCopyPlant}
        />
        
      </div>
    </DndProvider>
  );
};
