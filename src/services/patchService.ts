
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Patch, PatchFormValues, PatchType, PlacementType } from "@/lib/types";
import { toast } from "sonner";

// Fetch all patches for the current user
export const fetchPatches = async (): Promise<Patch[]> => {
  try {
    const { data: patchesData, error: patchesError } = await supabase
      .from('patches')
      .select('*');
    
    if (patchesError) throw patchesError;
    
    const formattedPatches: Patch[] = patchesData.map(patch => ({
      id: patch.id,
      name: patch.name,
      length: Number(patch.width), // Map from width to length (for backward compatibility)
      width: Number(patch.height), // Map from height to width (for backward compatibility)
      height: Number(patch.height), // Set height explicitly
      type: (patch.type as PatchType) || "outdoor-soil",
      heated: patch.heated || false,
      artificialLight: patch.artificial_light || false,
      naturalLightPercentage: patch.natural_light_percentage || 100,
      placementType: (patch.placement_type as PlacementType) || "free",
      slotsLength: patch.slots_length || 4,
      slotsWidth: patch.slots_width || 6
    }));
    
    return formattedPatches;
  } catch (error) {
    console.error("Error fetching patches:", error);
    throw error;
  }
};

// Fetch all tasks for patches
export const fetchPatchTasks = async (patchIds: string[]) => {
  try {
    const { data: tasksData, error: tasksError } = await supabase
      .from('patch_tasks')
      .select('*')
      .in('patch_id', patchIds);
    
    if (tasksError) throw tasksError;
    
    const tasksByPatch: Record<string, string[]> = {};
    tasksData.forEach(task => {
      if (!tasksByPatch[task.patch_id]) {
        tasksByPatch[task.patch_id] = [];
      }
      tasksByPatch[task.patch_id].push(task.task);
    });
    
    return tasksByPatch;
  } catch (error) {
    console.error("Error fetching patch tasks:", error);
    throw error;
  }
};

// Create a new patch
export const createPatch = async (data: PatchFormValues): Promise<Patch> => {
  try {
    const { data: newPatch, error } = await supabase
      .from('patches')
      .insert({
        name: data.name,
        width: parseFloat(data.length as any) || 2, // Store length as width (for backward compatibility)
        height: parseFloat(data.width as any) || 2, // Store width as height (for backward compatibility)
        type: data.type || "outdoor-soil",
        heated: data.heated || false,
        artificial_light: data.artificialLight || false,
        natural_light_percentage: data.naturalLightPercentage || 100,
        placement_type: data.placementType || "free",
        slots_length: data.slotsLength || 4,
        slots_width: data.slotsWidth || 6,
        user_id: ANONYMOUS_USER_ID
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const formattedPatch: Patch = {
      id: newPatch.id,
      name: newPatch.name,
      length: Number(newPatch.width), // Map from width to length (for backward compatibility)
      width: Number(newPatch.height), // Map from height to width (for backward compatibility)
      height: Number(newPatch.height), // Set height explicitly
      type: newPatch.type as PatchType,
      heated: newPatch.heated || false,
      artificialLight: newPatch.artificial_light || false,
      naturalLightPercentage: newPatch.natural_light_percentage || 100,
      placementType: (newPatch.placement_type as PlacementType) || "free",
      slotsLength: newPatch.slots_length || 4,
      slotsWidth: newPatch.slots_width || 6
    };
    
    return formattedPatch;
  } catch (error) {
    console.error("Error adding patch:", error);
    throw error;
  }
};

// Update an existing patch
export const updatePatch = async (patchId: string, data: PatchFormValues) => {
  try {
    const { error } = await supabase
      .from('patches')
      .update({
        name: data.name,
        width: parseFloat(data.length as any) || 2, // Store length as width (for backward compatibility)
        height: parseFloat(data.width as any) || 2, // Store width as height (for backward compatibility)
        type: data.type,
        heated: data.heated,
        artificial_light: data.artificialLight,
        natural_light_percentage: data.naturalLightPercentage,
        placement_type: data.placementType || "free",
        slots_length: data.slotsLength || 4,
        slots_width: data.slotsWidth || 6
      })
      .eq('id', patchId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error updating patch:", error);
    throw error;
  }
};

// Delete a patch
export const deletePatch = async (patchId: string) => {
  try {
    const { error } = await supabase
      .from('patches')
      .delete()
      .eq('id', patchId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting patch:", error);
    throw error;
  }
};

// Add a task to a patch
export const addPatchTask = async (patchId: string, task: string) => {
  if (!task.trim()) return;
  
  try {
    const { error } = await supabase
      .from('patch_tasks')
      .insert({
        patch_id: patchId,
        task: task,
        user_id: ANONYMOUS_USER_ID
      });
    
    if (error) throw error;
    
    return task;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

// Delete a task from a patch
export const deletePatchTask = async (patchId: string, taskIndex: number, tasks: string[]) => {
  try {
    const taskToDelete = tasks[taskIndex];
    
    const { data: taskData, error: fetchError } = await supabase
      .from('patch_tasks')
      .select('id')
      .eq('patch_id', patchId)
      .eq('task', taskToDelete)
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    if (taskData && taskData.length > 0) {
      const { error } = await supabase
        .from('patch_tasks')
        .delete()
        .eq('id', taskData[0].id);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
