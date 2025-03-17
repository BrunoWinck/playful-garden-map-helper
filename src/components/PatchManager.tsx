
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Patch, PatchFormValues } from "@/lib/types";
import { 
  fetchPatches, 
  fetchPatchTasks,
  createPatch, 
  updatePatch, 
  deletePatch, 
  addPatchTask, 
  deletePatchTask 
} from "@/services/patchService";
import { PatchForm } from "./garden/PatchForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit, Plus } from "lucide-react";
import { eventBus, PATCH_EVENTS } from "@/lib/eventBus";

export const PatchManager = () => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchTasks, setPatchTasks] = useState<Record<string, string[]>>({});
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskInput, setTaskInput] = useState("");
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const loadPatchData = async () => {
    try {
      setIsLoading(true);
      const patchesData = await fetchPatches();
      setPatches(patchesData);
      
      if (patchesData.length > 0) {
        const tasksByPatch = await fetchPatchTasks(patchesData.map(p => p.id));
        setPatchTasks(tasksByPatch);
        if (!selectedPatchId && patchesData.length > 0) {
          setSelectedPatchId(patchesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching patches:", error);
      toast.error("Failed to load your garden patches");
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  };
  
  useEffect(() => {
    loadPatchData();
  }, []);
  
  // Only emit event when patches change AFTER initial load
  useEffect(() => {
    if (patches.length > 0 && initialLoadComplete && !isLoading) {
      console.log("PatchManager: Initial load completed, emitting PATCHES_UPDATED event");
      eventBus.emit(PATCH_EVENTS.PATCHES_UPDATED, patches);
    }
  }, [initialLoadComplete]);
  
  const handleAddPatch = async (data: PatchFormValues) => {
    try {
      const newPatch = await createPatch(data);
      setPatches(prev => [...prev, newPatch]);
      toast.success(`Added new patch: ${newPatch.name}`);
      
      // Emit event for new patch
      console.log("PatchManager: Emitting PATCH_ADDED event");
      eventBus.emit(PATCH_EVENTS.PATCH_ADDED, newPatch);
      setSelectedPatchId(newPatch.id);
    } catch (error) {
      console.error("Error adding patch:", error);
      toast.error("Failed to add patch");
    }
  };
  
  const handleDeletePatch = async (patchId: string) => {
    try {
      await deletePatch(patchId);
      const updatedPatches = patches.filter(patch => patch.id !== patchId);
      setPatches(updatedPatches);
      
      const newPatchTasks = { ...patchTasks };
      delete newPatchTasks[patchId];
      setPatchTasks(newPatchTasks);
      
      toast.success("Patch removed");
      
      // Emit event for deleted patch
      console.log("PatchManager: Emitting PATCH_DELETED event");
      eventBus.emit(PATCH_EVENTS.PATCH_DELETED, patchId);
      
      if (selectedPatchId === patchId) {
        setSelectedPatchId(updatedPatches.length > 0 ? updatedPatches[0].id : null);
      }
    } catch (error) {
      console.error("Error deleting patch:", error);
      toast.error("Failed to delete patch");
    }
  };
  
  const handleAddTask = async () => {
    if (!selectedPatchId || !taskInput.trim()) return;
    
    try {
      await addPatchTask(selectedPatchId, taskInput);
      
      setPatchTasks(prev => {
        const currentTasks = prev[selectedPatchId] || [];
        return {
          ...prev,
          [selectedPatchId]: [...currentTasks, taskInput]
        };
      });
      
      setTaskInput("");
      toast.success("Task added");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };
  
  const handleDeleteTask = async (taskIndex: number) => {
    if (!selectedPatchId) return;
    
    try {
      const tasks = patchTasks[selectedPatchId] || [];
      await deletePatchTask(selectedPatchId, taskIndex, tasks);
      
      setPatchTasks(prev => {
        const tasks = [...(prev[selectedPatchId] || [])];
        tasks.splice(taskIndex, 1);
        return {
          ...prev,
          [selectedPatchId]: tasks
        };
      });
      
      toast.success("Task removed");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };
  
  const handleEditPatch = (patch: Patch) => {
    setEditingPatchId(patch.id);
  };
  
  const handleSaveEdit = async (data: PatchFormValues) => {
    if (!editingPatchId) return;
    
    try {
      await updatePatch(editingPatchId, data);
      
      const updatedPatches = patches.map(patch => 
        patch.id === editingPatchId 
          ? { 
              ...patch, 
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
            } 
          : patch
      );
      
      setPatches(updatedPatches);
      
      // Emit event for edited patch
      const editedPatch = updatedPatches.find(p => p.id === editingPatchId);
      if (editedPatch) {
        console.log("PatchManager: Emitting PATCH_EDITED event");
        eventBus.emit(PATCH_EVENTS.PATCH_EDITED, editedPatch);
      }
      
      setEditingPatchId(null);
      toast.success("Patch updated");
    } catch (error) {
      console.error("Error updating patch:", error);
      toast.error("Failed to update patch");
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <PatchForm 
        onSubmit={editingPatchId ? handleSaveEdit : handleAddPatch}
        initialValues={editingPatchId 
          ? {
              name: patches.find(p => p.id === editingPatchId)?.name || "",
              length: patches.find(p => p.id === editingPatchId)?.length || 2,
              width: patches.find(p => p.id === editingPatchId)?.width || 2,
              type: patches.find(p => p.id === editingPatchId)?.type || "outdoor-soil",
              heated: patches.find(p => p.id === editingPatchId)?.heated || false,
              artificialLight: patches.find(p => p.id === editingPatchId)?.artificialLight || false,
              naturalLightPercentage: patches.find(p => p.id === editingPatchId)?.naturalLightPercentage || 100,
              placementType: patches.find(p => p.id === editingPatchId)?.placementType || "free",
              slotsLength: patches.find(p => p.id === editingPatchId)?.slotsLength || 4,
              slotsWidth: patches.find(p => p.id === editingPatchId)?.slotsWidth || 6
            } 
          : undefined} 
        isEditing={!!editingPatchId}
      />
      
      {patches.length > 0 && (
        <div className="space-y-3 mt-4">
          <h3 className="font-medium text-green-800">Select a Patch:</h3>
          <div className="flex flex-wrap gap-2">
            {patches.map(patch => (
              <div key={patch.id} className="relative">
                <Button
                  variant={selectedPatchId === patch.id ? "default" : "outline"}
                  className="mr-6"
                  onClick={() => setSelectedPatchId(patch.id)}
                >
                  {patch.name}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-6 w-6 -mr-2 -mt-2 bg-white rounded-full text-red-500 border border-red-300 shadow-sm"
                  onClick={() => handleDeletePatch(patch.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          {selectedPatchId && (
            <>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPatch(patches.find(p => p.id === selectedPatchId)!)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit Patch Details
                </Button>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Tasks for this patch:</h4>
                <div className="flex items-center mb-2">
                  <Input 
                    placeholder="Add a task for this patch" 
                    className="text-sm h-8"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTask();
                      }
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-1 h-8 w-8 text-green-700"
                    onClick={handleAddTask}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <ul className="space-y-1 text-sm">
                  {(patchTasks[selectedPatchId] || []).map((task, index) => (
                    <li key={index} className="flex items-center justify-between py-1 px-2 rounded bg-white">
                      <span>{task}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleDeleteTask(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      
      {patches.length === 0 && (
        <p className="text-gray-500 text-sm mt-4">No patches yet. Add your first patch!</p>
      )}
    </div>
  );
};
