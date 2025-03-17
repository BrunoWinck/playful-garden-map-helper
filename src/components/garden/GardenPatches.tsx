
import React, { useState } from "react";
import { Patch, PlantItem } from "@/lib/types";
import { RegularPatch } from "./RegularPatch";
import { SeedTray } from "./SeedTray";
import { PatchCard } from "./PatchCard";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, ListPlus, X } from "lucide-react";
import { PatchForm } from "./PatchForm";
import { deletePatch, updatePatch, addPatchTask } from "@/services/patchService";
import { toast } from "sonner";
import { eventBus, PATCH_EVENTS } from "@/lib/eventBus";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface GardenPatchesProps {
  patches: Patch[];
  plantedItems: Record<string, PlantItem[]>;
  handleDrop: (item: PlantItem, x: number, y: number, patchId: string) => void;
  patchColors: string[];
  onGrowPlant: (plantItem: PlantItem, direction: "up" | "down") => void;
  onDeletePlant: (plantItem: PlantItem) => void;
  onCopyPlant: (plantItem: PlantItem, count: number) => void;
}

export const GardenPatches = ({ 
  patches, 
  plantedItems, 
  handleDrop, 
  patchColors,
  onGrowPlant,
  onDeletePlant,
  onCopyPlant
}: GardenPatchesProps) => {
  const [editingPatch, setEditingPatch] = useState<Patch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [activeTaskPatchId, setActiveTaskPatchId] = useState<string | null>(null);

  const handleEditPatch = (patch: Patch) => {
    setEditingPatch(patch);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    if (!editingPatch) return;
    
    try {
      await updatePatch(editingPatch.id, data);
      
      const updatedPatch = { 
        ...editingPatch, 
        name: data.name, 
        length: parseFloat(data.length as any) || 2,
        width: parseFloat(data.width as any) || 2,
        height: parseFloat(data.width as any) || 2,
        type: data.type,
        heated: data.heated,
        artificialLight: data.artificialLight,
        naturalLightPercentage: data.naturalLightPercentage,
        placementType: data.placementType || "free",
        slotsLength: data.slotsLength || 4,
        slotsWidth: data.slotsWidth || 6
      };
      
      // Emit event for edited patch
      console.log("GardenPatches: Emitting PATCH_EDITED event");
      eventBus.emit(PATCH_EVENTS.PATCH_EDITED, updatedPatch);
      
      setIsEditDialogOpen(false);
      setEditingPatch(null);
      toast.success("Patch updated");
    } catch (error) {
      console.error("Error updating patch:", error);
      toast.error("Failed to update patch");
    }
  };

  const handleDeletePatchClick = async (patchId: string) => {
    try {
      await deletePatch(patchId);
      
      // Emit event for deleted patch
      console.log("GardenPatches: Emitting PATCH_DELETED event");
      eventBus.emit(PATCH_EVENTS.PATCH_DELETED, patchId);
      
      toast.success("Patch removed");
    } catch (error) {
      console.error("Error deleting patch:", error);
      toast.error("Failed to delete patch");
    }
  };

  const handleAddTask = async () => {
    if (!activeTaskPatchId || !newTask.trim()) return;
    
    try {
      await addPatchTask(activeTaskPatchId, newTask);
      toast.success("Task added");
      setNewTask("");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {patches.map((patch, index) => (
        <PatchCard 
          key={patch.id} 
          title={
            <div className="flex justify-between items-center w-full">
              <span>{patch.name}</span>
              <div className="flex items-center space-x-1">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setActiveTaskPatchId(patch.id)}
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Add Tasks for {patch.name}</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Input 
                          placeholder="Add a task for this patch" 
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTask();
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleAddTask}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => handleEditPatch(patch)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm">Delete this patch?</p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">Cancel</Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeletePatchClick(patch.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          } 
          className={patchColors[index % patchColors.length]}
        >
          {patch.placementType === "slots" ? (
            <SeedTray 
              patch={patch} 
              plantedItems={plantedItems[patch.id] || []} 
              handleDrop={handleDrop} 
              onGrowPlant={onGrowPlant}
              onDeletePlant={onDeletePlant}
              onCopyPlant={onCopyPlant}
            />
          ) : (
            <RegularPatch 
              patch={patch} 
              plantedItems={plantedItems[patch.id] || []} 
              handleDrop={handleDrop} 
              onGrowPlant={onGrowPlant}
              onDeletePlant={onDeletePlant}
              onCopyPlant={onCopyPlant}
            />
          )}
        </PatchCard>
      ))}

      {/* Edit Patch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Patch</DialogTitle>
          </DialogHeader>
          {editingPatch && (
            <PatchForm 
              onSubmit={handleSaveEdit}
              initialValues={{
                name: editingPatch.name,
                length: editingPatch.length,
                width: editingPatch.width,
                type: editingPatch.type,
                heated: editingPatch.heated,
                artificialLight: editingPatch.artificialLight,
                naturalLightPercentage: editingPatch.naturalLightPercentage,
                placementType: editingPatch.placementType,
                slotsLength: editingPatch.slotsLength,
                slotsWidth: editingPatch.slotsWidth
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
