
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Move, Edit } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type PatchType = "outdoor-soil" | "perennials" | "indoor" | "protected";

type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
  type: PatchType;
  heated: boolean;
  artificialLight: boolean;
  naturalLightPercentage: number;
  task?: string;
};

export const PatchManager = () => {
  const [patches, setPatches] = useState<Patch[]>([
    { 
      id: "patch-1", 
      name: "Vegetable Patch", 
      width: 3, 
      height: 2, 
      type: "outdoor-soil",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100
    },
    { 
      id: "patch-2", 
      name: "Herb Garden", 
      width: 1, 
      height: 0.5, 
      type: "protected",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 80
    },
    { 
      id: "patch-3", 
      name: "Strawberry Patch", 
      width: 2, 
      height: 3, 
      type: "outdoor-soil",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 90
    },
    { 
      id: "patch-4", 
      name: "Tree Patch", 
      width: 5, 
      height: 5, 
      type: "perennials",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100
    },
    { 
      id: "patch-5", 
      name: "Indoor Seedling Trays", 
      width: 1, 
      height: 0.5, 
      type: "indoor",
      heated: true,
      artificialLight: true,
      naturalLightPercentage: 40
    }
  ]);
  
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  
  // Create a task for a patch
  const [patchTasks, setPatchTasks] = useState<Record<string, string[]>>({
    "patch-1": ["Water twice a week", "Add compost in spring"],
    "patch-2": ["Trim herbs monthly", "Replant basil in summer"],
    "patch-3": ["Check for runners weekly", "Mulch in autumn"],
    "patch-4": ["Prune annually", "Check for pests quarterly"],
    "patch-5": ["Check moisture daily", "Rotate trays weekly"]
  });
  
  const form = useForm({
    defaultValues: {
      name: "",
      width: 2,
      height: 2,
      type: "outdoor-soil" as PatchType,
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100,
      task: ""
    }
  });
  
  // Add a new patch
  const handleAddPatch = (data: any) => {
    const newPatch: Patch = {
      id: `patch-${Date.now()}`,
      name: data.name,
      width: parseFloat(data.width) || 2,
      height: parseFloat(data.height) || 2,
      type: data.type || "outdoor-soil",
      heated: data.heated || false,
      artificialLight: data.artificialLight || false,
      naturalLightPercentage: data.naturalLightPercentage || 100,
    };
    
    setPatches([...patches, newPatch]);
    form.reset({ 
      name: "", 
      width: 2, 
      height: 2, 
      type: "outdoor-soil",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100,
      task: "" 
    });
    toast.success(`Added new patch: ${newPatch.name}`);
  };
  
  // Delete a patch
  const handleDeletePatch = (patchId: string) => {
    setPatches(patches.filter(patch => patch.id !== patchId));
    // Also remove associated tasks
    const newPatchTasks = { ...patchTasks };
    delete newPatchTasks[patchId];
    setPatchTasks(newPatchTasks);
    toast.success("Patch removed");
  };
  
  // Add a task to a patch
  const handleAddTask = (patchId: string, task: string) => {
    if (!task.trim()) return;
    
    setPatchTasks(prev => {
      const currentTasks = prev[patchId] || [];
      return {
        ...prev,
        [patchId]: [...currentTasks, task]
      };
    });
    
    form.setValue("task", "");
    toast.success("Task added");
  };
  
  // Delete a task
  const handleDeleteTask = (patchId: string, taskIndex: number) => {
    setPatchTasks(prev => {
      const tasks = [...(prev[patchId] || [])];
      tasks.splice(taskIndex, 1);
      return {
        ...prev,
        [patchId]: tasks
      };
    });
    toast.success("Task removed");
  };
  
  // Start editing a patch
  const handleEditPatch = (patch: Patch) => {
    setEditingPatchId(patch.id);
    form.reset({
      name: patch.name,
      width: patch.width,
      height: patch.height,
      type: patch.type,
      heated: patch.heated,
      artificialLight: patch.artificialLight,
      naturalLightPercentage: patch.naturalLightPercentage,
      task: ""
    });
  };
  
  // Save edit
  const handleSaveEdit = (data: any) => {
    if (!editingPatchId) return;
    
    setPatches(patches.map(patch => 
      patch.id === editingPatchId 
        ? { 
            ...patch, 
            name: data.name, 
            width: parseFloat(data.width) || 2, 
            height: parseFloat(data.height) || 2,
            type: data.type,
            heated: data.heated,
            artificialLight: data.artificialLight,
            naturalLightPercentage: data.naturalLightPercentage
          } 
        : patch
    ));
    
    setEditingPatchId(null);
    form.reset({ 
      name: "", 
      width: 2, 
      height: 2, 
      type: "outdoor-soil",
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100,
      task: "" 
    });
    toast.success("Patch updated");
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
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Height (m)</FormLabel>
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
                          {patch.width}×{patch.height}m
                        </span>
                      </div>
                      <div>
                        <span className="inline-block w-24">Type:</span>
                        <span className="font-normal">
                          {getPatchTypeLabel(patch.type)}
                        </span>
                      </div>
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
                
                {/* Tasks section */}
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
                  
                  {/* Task list */}
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
