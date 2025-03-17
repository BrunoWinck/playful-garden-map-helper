
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Move, Edit } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";

type PatchType = "outdoor-soil" | "perennials" | "indoor" | "protected";
type PlacementType = "free" | "slots";

type Patch = {
  id: string;
  name: string;
  length: number;
  width: number;
  type: PatchType;
  heated: boolean;
  artificialLight: boolean;
  naturalLightPercentage: number;
  placementType: PlacementType;
  slotsLength: number;
  slotsWidth: number;
};

export const PatchManager = () => {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchTasks, setPatchTasks] = useState<Record<string, string[]>>({});
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm({
    defaultValues: {
      name: "",
      length: 2,
      width: 2,
      type: "outdoor-soil" as PatchType,
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100,
      placementType: "free" as PlacementType,
      slotsLength: 4,
      slotsWidth: 6,
      task: ""
    }
  });
  
  const watchType = form.watch("type");
  const watchPlacementType = form.watch("placementType");
  
  useEffect(() => {
    // Reset heated and artificial light when outdoor-soil is selected
    if (watchType === "outdoor-soil") {
      form.setValue("heated", false);
      form.setValue("artificialLight", false);
    }
  }, [watchType, form]);
  
  const fetchPatches = async () => {
    try {
      const { data: patchesData, error: patchesError } = await supabase
        .from('patches')
        .select('*');
      
      if (patchesError) throw patchesError;
      
      const formattedPatches = patchesData.map(patch => ({
        id: patch.id,
        name: patch.name,
        length: Number(patch.width), // Map from width to length (for backward compatibility)
        width: Number(patch.height), // Map from height to width (for backward compatibility)
        type: patch.type as PatchType,
        heated: patch.heated,
        artificialLight: patch.artificial_light,
        naturalLightPercentage: patch.natural_light_percentage,
        placementType: patch.placement_type as PlacementType || "free",
        slotsLength: patch.slots_length || 4,
        slotsWidth: patch.slots_width || 6
      }));
      
      setPatches(formattedPatches);
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('patch_tasks')
        .select('*')
        .in('patch_id', formattedPatches.map(p => p.id));
      
      if (tasksError) throw tasksError;
      
      const tasksByPatch: Record<string, string[]> = {};
      tasksData.forEach(task => {
        if (!tasksByPatch[task.patch_id]) {
          tasksByPatch[task.patch_id] = [];
        }
        tasksByPatch[task.patch_id].push(task.task);
      });
      
      setPatchTasks(tasksByPatch);
    } catch (error) {
      console.error("Error fetching patches:", error);
      toast.error("Failed to load your garden patches");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPatches();
  }, []);
  
  useEffect(() => {
    if (patches.length > 0 && !isLoading) {
      localStorage.setItem('garden-patches', JSON.stringify(patches));
    }
  }, [patches, isLoading]);
  
  useEffect(() => {
    if (Object.keys(patchTasks).length > 0 && !isLoading) {
      localStorage.setItem('garden-planted-items', JSON.stringify(patchTasks));
    }
  }, [patchTasks, isLoading]);
  
  const handleAddPatch = async (data: any) => {
    try {
      const { data: newPatch, error } = await supabase
        .from('patches')
        .insert({
          name: data.name,
          width: parseFloat(data.length) || 2, // Store length as width (for backward compatibility)
          height: parseFloat(data.width) || 2, // Store width as height (for backward compatibility)
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
        type: newPatch.type as PatchType,
        heated: newPatch.heated,
        artificialLight: newPatch.artificial_light,
        naturalLightPercentage: newPatch.natural_light_percentage,
        placementType: newPatch.placement_type as PlacementType || "free",
        slotsLength: newPatch.slots_length || 4,
        slotsWidth: newPatch.slots_width || 6
      };
      
      setPatches([...patches, formattedPatch]);
      
      form.reset({ 
        name: "", 
        length: 2, 
        width: 2, 
        type: "outdoor-soil",
        heated: false,
        artificialLight: false,
        naturalLightPercentage: 100,
        placementType: "free",
        slotsLength: 4,
        slotsWidth: 6,
        task: "" 
      });
      
      toast.success(`Added new patch: ${formattedPatch.name}`);
    } catch (error) {
      console.error("Error adding patch:", error);
      toast.error("Failed to add patch");
    }
  };
  
  const handleDeletePatch = async (patchId: string) => {
    try {
      const { error } = await supabase
        .from('patches')
        .delete()
        .eq('id', patchId);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('patch_tasks')
        .insert({
          patch_id: patchId,
          task: task,
          user_id: ANONYMOUS_USER_ID
        });
      
      if (error) throw error;
      
      setPatchTasks(prev => {
        const currentTasks = prev[patchId] || [];
        return {
          ...prev,
          [patchId]: [...currentTasks, task]
        };
      });
      
      form.setValue("task", "");
      toast.success("Task added");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };
  
  const handleDeleteTask = async (patchId: string, taskIndex: number) => {
    try {
      const tasks = patchTasks[patchId] || [];
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
    form.reset({
      name: patch.name,
      length: patch.length,
      width: patch.width,
      type: patch.type,
      heated: patch.heated,
      artificialLight: patch.artificialLight,
      naturalLightPercentage: patch.naturalLightPercentage,
      placementType: patch.placementType || "free",
      slotsLength: patch.slotsLength || 4,
      slotsWidth: patch.slotsWidth || 6,
      task: ""
    });
  };
  
  const handleSaveEdit = async (data: any) => {
    if (!editingPatchId) return;
    
    try {
      const { error } = await supabase
        .from('patches')
        .update({
          name: data.name,
          width: parseFloat(data.length) || 2, // Store length as width (for backward compatibility)
          height: parseFloat(data.width) || 2, // Store width as height (for backward compatibility)
          type: data.type,
          heated: data.heated,
          artificial_light: data.artificialLight,
          natural_light_percentage: data.naturalLightPercentage,
          placement_type: data.placementType || "free",
          slots_length: data.slotsLength || 4,
          slots_width: data.slotsWidth || 6
        })
        .eq('id', editingPatchId);
      
      if (error) throw error;
      
      setPatches(patches.map(patch => 
        patch.id === editingPatchId 
          ? { 
              ...patch, 
              name: data.name, 
              length: parseFloat(data.length) || 2,
              width: parseFloat(data.width) || 2,
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
      form.reset({ 
        name: "", 
        length: 2, 
        width: 2, 
        type: "outdoor-soil",
        heated: false,
        artificialLight: false,
        naturalLightPercentage: 100,
        placementType: "free",
        slotsLength: 4,
        slotsWidth: 6,
        task: "" 
      });
      
      toast.success("Patch updated");
    } catch (error) {
      console.error("Error updating patch:", error);
      toast.error("Failed to update patch");
    }
  };

  const getPatchTypeLabel = (type: PatchType): string => {
    switch (type) {
      case "outdoor-soil":
        return "Outdoor Soil";
      case "perennials":
        return "Perennials";
      case "indoor":
        return "Indoor";
      case "protected":
        return "Protected";
      default:
        return "Unknown";
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(editingPatchId ? handleSaveEdit : handleAddPatch)} className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Patch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Vegetable Patch" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Length (m)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.5" max="10" step="0.5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Width (m)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.5" max="10" step="0.5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Patch Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patch type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="outdoor-soil">Outdoor Soil</SelectItem>
                      <SelectItem value="perennials">Perennials</SelectItem>
                      <SelectItem value="indoor">Indoor</SelectItem>
                      <SelectItem value="protected">Protected</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placementType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-green-700">Plant Placement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-1"
                    >
                      <div className="flex items-center space-x-2 border rounded-l-md px-3 py-2">
                        <RadioGroupItem value="free" id="free" />
                        <FormLabel htmlFor="free" className="cursor-pointer">Free Placement</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-r-md px-3 py-2">
                        <RadioGroupItem value="slots" id="slots" />
                        <FormLabel htmlFor="slots" className="cursor-pointer">Seed Tray Slots</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            {watchPlacementType === "slots" && (
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-green-50">
                <FormField
                  control={form.control}
                  name="slotsLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-700">Slots in Length</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20" 
                          step="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slotsWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-700">Slots in Width</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="20" 
                          step="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="col-span-2 text-xs text-green-800 flex justify-center items-center pt-1">
                  Total: {form.watch("slotsLength") * form.watch("slotsWidth")} slots
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="heated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Heated</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={watchType === "outdoor-soil"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artificialLight"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Artificial Light</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={watchType === "outdoor-soil"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="naturalLightPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">
                    Natural Light: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="py-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {editingPatchId ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Update Patch
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Patch
              </>
            )}
          </Button>
        </form>
      </Form>
      
      <div className="space-y-2 mt-4">
        <h3 className="font-medium text-green-800">Your Garden Patches</h3>
        
        {patches.length === 0 ? (
          <p className="text-gray-500 text-sm">No patches yet. Add your first patch!</p>
        ) : (
          <div className="space-y-3">
            {patches.map(patch => (
              <div key={patch.id} className="border rounded-md p-3 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-green-800">
                    <div className="flex items-center">
                      <Move className="h-4 w-4 mr-2 text-green-600" />
                      {patch.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      <div>
                        <span className="inline-block w-24">Size:</span>
                        <span className="font-normal">
                          {patch.length}×{patch.width}m
                        </span>
                      </div>
                      <div>
                        <span className="inline-block w-24">Type:</span>
                        <span className="font-normal">
                          {getPatchTypeLabel(patch.type)}
                        </span>
                      </div>
                      {patch.placementType === "slots" && (
                        <div>
                          <span className="inline-block w-24">Slots:</span>
                          <span className="font-normal">
                            {patch.slotsLength || 4}×{patch.slotsWidth || 6} 
                            ({(patch.slotsLength || 4) * (patch.slotsWidth || 6)} total)
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="inline-block w-24">Natural Light:</span>
                        <span className="font-normal">
                          {patch.naturalLightPercentage}%
                        </span>
                      </div>
                      <div className="flex space-x-3">
                        {patch.heated && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                            Heated
                          </span>
                        )}
                        {patch.artificialLight && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            Artificial Light
                          </span>
                        )}
                        {patch.placementType === "slots" && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                            Seed Tray
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-amber-600"
                      onClick={() => handleEditPatch(patch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-600"
                      onClick={() => handleDeletePatch(patch.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <Input 
                      placeholder="Add a task for this patch" 
                      className="text-sm h-8"
                      value={form.watch("task")}
                      onChange={(e) => form.setValue("task", e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask(patch.id, form.watch("task"));
                        }
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-1 h-8 w-8 text-green-700"
                      onClick={() => handleAddTask(patch.id, form.watch("task"))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ul className="space-y-1 text-sm">
                    {(patchTasks[patch.id] || []).map((task, index) => (
                      <li key={index} className="flex items-center justify-between py-1 px-2 rounded bg-white">
                        <span>{task}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleDeleteTask(patch.id, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
