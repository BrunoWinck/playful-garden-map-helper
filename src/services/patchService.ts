import { supabase } from "@/integrations/supabase/client";
import { Patch, PatchFormValues, PatchType, PlacementType } from "@/lib/types";
import { toast } from "sonner";
import { getCurrentUser } from "./profileService";

// Fetch all patches for the current user
export const fetchPatches = async (): Promise<Patch[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error("No current user found");
      return [];
    }
    
    const { data: patchesData, error: patchesError } = await supabase
      .from('patches')
      .select('*')
      .eq('user_id', currentUser.id);
    
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
      slotsWidth: patch.slots_width || 6,
      containingPatchId: patch.containing_patch_id || undefined
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
    if (!patchIds.length) return {};
    
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("No current user found");
    }
    
    console.log("Creating patch with data:", data);
    
    // Generate a client-side UUID for the patch to ensure uniqueness
    const patchId = crypto.randomUUID();
    
    // First check if a patch with this ID already exists to prevent duplicates
    const { data: existingPatch, error: checkError } = await supabase
      .from('patches')
      .select('id')
      .eq('id', patchId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing patch:", checkError);
      throw checkError;
    }
    
    if (existingPatch) {
      console.error("Generated UUID already exists in database, regenerating...");
      // If by extremely rare chance we generated a duplicate ID, try again
      return createPatch(data);
    }
    
    // Now proceed with creating the patch
    const { data: newPatch, error } = await supabase
      .from('patches')
      .insert({
        id: patchId, 
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
        containing_patch_id: data.containingPatchId || null, // Add the containing patch ID
        user_id: currentUser.id
      })
      .select()
      .single();
    
    if (error) {
      console.error("Database error creating patch:", error);
      throw error;
    }
    
    if (!newPatch) {
      console.error("No data returned from patch creation");
      throw new Error("Failed to create patch: No data returned");
    }
    
    console.log("Patch created successfully:", newPatch);
    
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
      slotsWidth: newPatch.slots_width || 6,
      containingPatchId: newPatch.containing_patch_id || undefined
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
        slots_width: data.slotsWidth || 6,
        containing_patch_id: data.containingPatchId || null // Add the containing patch ID
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
    // Get the profile user rather than the auth user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error("No current user found");
      toast.error("Failed to add task: User not authenticated");
      return;
    }
    
    // Generate a client-side UUID for the task
    const taskId = crypto.randomUUID();
    
    // First check if a task with this ID already exists
    const { data: existingTask, error: checkError } = await supabase
      .from('patch_tasks')
      .select('id')
      .eq('id', taskId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing task:", checkError);
      throw checkError;
    }
    
    if (existingTask) {
      console.error("Generated task UUID already exists, regenerating...");
      // If by extremely rare chance we generated a duplicate ID, try again
      return addPatchTask(patchId, task);
    }
    
    // Insert the new task
    const { error } = await supabase
      .from('patch_tasks')
      .insert({
        id: taskId,
        patch_id: patchId,
        task: task,
        user_id: currentUser.id,
        completed: false
      });
    
    if (error) {
      console.error("Error adding task:", error);
      throw error;
    }
    
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

// Fetch top-level patches (patches that are not contained in any other patch)
export const fetchTopLevelPatches = async (): Promise<Patch[]> => {
  try {
    const allPatches = await fetchPatches();
    return allPatches.filter(patch => !patch.containingPatchId);
  } catch (error) {
    console.error("Error fetching top-level patches:", error);
    throw error;
  }
};

// Fetch child patches of a specific parent patch
export const fetchChildPatches = async (parentPatchId: string): Promise<Patch[]> => {
  try {
    const allPatches = await fetchPatches();
    return allPatches.filter(patch => patch.containingPatchId === parentPatchId);
  } catch (error) {
    console.error("Error fetching child patches:", error);
    throw error;
  }
};
