
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const loadPatchData = async () => {
    try {
      setIsLoading(true);
      const patchesData = await fetchPatches();
      
      // Check for duplicate IDs
      const uniqueIds = new Set<string>();
      const duplicateIds: string[] = [];
      
      patchesData.forEach(patch => {
        if (uniqueIds.has(patch.id)) {
          duplicateIds.push(patch.id);
        } else {
          uniqueIds.add(patch.id);
        }
      });
      
      if (duplicateIds.length > 0) {
        console.error("Detected duplicate patch IDs in database:", duplicateIds);
      }
      
      // Use only unique patches
      const uniquePatches = patchesData.filter((patch, index) => {
        return patchesData.findIndex(p => p.id === patch.id) === index;
      });
      
      setPatches(uniquePatches);
      
      if (uniquePatches.length > 0) {
        const tasksByPatch = await fetchPatchTasks(uniquePatches.map(p => p.id));
        setPatchTasks(tasksByPatch);
        if (!selectedPatchId && uniquePatches.length > 0) {
          setSelectedPatchId(uniquePatches[0].id);
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
  }, [initialLoadComplete, patches, isLoading]);
  
  const handleAddPatch = async (data: PatchFormValues) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Create a new patch using the patchService which now uses crypto.randomUUID()
      const newPatch = await createPatch(data);
      
      // First update the state
      setPatches(prev => {
        // Make sure we don't add a duplicate
        if (prev.some(p => p.id === newPatch.id)) {
          console.warn("Prevented adding duplicate patch with ID:", newPatch.id);
          return prev;
        }
        return [...prev, newPatch];
      });
      
      // Only show toast after successful database operation
      toast.success(`Added new patch: ${newPatch.name}`);
      
      // Emit event for new patch
      console.log("PatchManager: Emitting PATCH_ADDED event");
      eventBus.emit(PATCH_EVENTS.PATCH_ADDED, newPatch);
      setSelectedPatchId(newPatch.id);
    } catch (error) {
      console.error("Error adding patch:", error);
      toast.error("Failed to add patch");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeletePatch = async (patchId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddTask = async () => {
    if (isProcessing || !selectedPatchId || !taskInput.trim()) return;
    
    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteTask = async (taskIndex: number) => {
    if (isProcessing || !selectedPatchId) return;
    
    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleEditPatch = (patch: Patch) => {
    setEditingPatchId(patch.id);
  };
  
  const handleSaveEdit = async (data: PatchFormValues) => {
    if (isProcessing || !editingPatchId) return;
    
    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
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
            {patches.map((patch, index) => (
              <div key={`${patch.id}-${index}`} className="relative">
                <Button
                  variant={selectedPatchId === patch.id ? "default" : "outline"}
                  className="mr-6"
                  onClick={() => setSelectedPatchId(patch.id)}
                  disabled={isProcessing}
                >
                  {patch.name}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-6 w-6 -mr-2 -mt-2 bg-white rounded-full text-red-500 border border-red-300 shadow-sm"
                  onClick={() => handleDeletePatch(patch.id)}
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                    disabled={isProcessing}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        handleAddTask();
                      }
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-1 h-8 w-8 text-green-700"
                    onClick={handleAddTask}
                    disabled={isProcessing}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <ul className="space-y-1 text-sm">
                  {(patchTasks[selectedPatchId] || []).map((task, index) => (
                    <li key={`task-${selectedPatchId}-${index}`} className="flex items-center justify-between py-1 px-2 rounded bg-white">
                      <span>{task}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleDeleteTask(index)}
                        disabled={isProcessing}
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
