
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
import { PatchCard } from "./garden/PatchCard";

export const PatchManager = () => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchTasks, setPatchTasks] = useState<Record<string, string[]>>({});
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadPatchData = async () => {
    try {
      const patchesData = await fetchPatches();
      setPatches(patchesData);
      
      if (patchesData.length > 0) {
        const tasksByPatch = await fetchPatchTasks(patchesData.map(p => p.id));
        setPatchTasks(tasksByPatch);
      }
    } catch (error) {
      console.error("Error fetching patches:", error);
      toast.error("Failed to load your garden patches");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPatchData();
  }, []);
  
  useEffect(() => {
    if (patches.length > 0 && !isLoading) {
      localStorage.setItem('garden-patches', JSON.stringify(patches));
    }
  }, [patches, isLoading]);
  
  useEffect(() => {
    if (Object.keys(patchTasks).length > 0 && !isLoading) {
      localStorage.setItem('garden-patch-tasks', JSON.stringify(patchTasks));
    }
  }, [patchTasks, isLoading]);
  
  const handleAddPatch = async (data: PatchFormValues) => {
    try {
      const newPatch = await createPatch(data);
      setPatches([...patches, newPatch]);
      toast.success(`Added new patch: ${newPatch.name}`);
    } catch (error) {
      console.error("Error adding patch:", error);
      toast.error("Failed to add patch");
    }
  };
  
  const handleDeletePatch = async (patchId: string) => {
    try {
      await deletePatch(patchId);
      setPatches(patches.filter(patch => patch.id !== patchId));
      
      const newPatchTasks = { ...patchTasks };
      delete newPatchTasks[patchId];
      setPatchTasks(newPatchTasks);
      
      toast.success("Patch removed");
    } catch (error) {
      console.error("Error deleting patch:", error);
      toast.error("Failed to delete patch");
    }
  };
  
  const handleAddTask = async (patchId: string, task: string) => {
    if (!task.trim()) return;
    
    try {
      await addPatchTask(patchId, task);
      
      setPatchTasks(prev => {
        const currentTasks = prev[patchId] || [];
        return {
          ...prev,
          [patchId]: [...currentTasks, task]
        };
      });
      
      toast.success("Task added");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };
  
  const handleDeleteTask = async (patchId: string, taskIndex: number) => {
    try {
      const tasks = patchTasks[patchId] || [];
      await deletePatchTask(patchId, taskIndex, tasks);
      
      setPatchTasks(prev => {
        const tasks = [...(prev[patchId] || [])];
        tasks.splice(taskIndex, 1);
        return {
          ...prev,
          [patchId]: tasks
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
      
      setPatches(patches.map(patch => 
        patch.id === editingPatchId 
          ? { 
              ...patch, 
              name: data.name, 
              length: parseFloat(data.length as any) || 2,
              width: parseFloat(data.width as any) || 2,
              type: data.type,
              heated: data.heated,
              artificialLight: data.artificialLight,
              naturalLightPercentage: data.naturalLightPercentage,
              placementType: data.placementType || "free",
              slotsLength: data.slotsLength || 4,
              slotsWidth: data.slotsWidth || 6
            } 
          : patch
      ));
      
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
        initialValues={editingPatchId ? patches.find(p => p.id === editingPatchId) : undefined} 
        isEditing={!!editingPatchId}
      />
      
      <div className="space-y-2 mt-4">
        <h3 className="font-medium text-green-800">Your Garden Patches</h3>
        
        {patches.length === 0 ? (
          <p className="text-gray-500 text-sm">No patches yet. Add your first patch!</p>
        ) : (
          <div className="space-y-3">
            {patches.map(patch => (
              <PatchCard
                key={patch.id}
                patch={patch}
                tasks={patchTasks[patch.id] || []}
                onEdit={() => handleEditPatch(patch)}
                onDelete={handleDeletePatch}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
