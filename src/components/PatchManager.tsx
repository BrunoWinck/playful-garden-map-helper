
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Move, Edit } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
  task?: string;
};

export const PatchManager = () => {
  const [patches, setPatches] = useState<Patch[]>([
    { id: "patch-1", name: "Vegetable Patch", width: 3, height: 2 },
    { id: "patch-2", name: "Herb Garden", width: 2, height: 2 }
  ]);
  
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  
  // Create a task for a patch
  const [patchTasks, setPatchTasks] = useState<Record<string, string[]>>({
    "patch-1": ["Water twice a week", "Add compost in spring"],
    "patch-2": ["Trim herbs monthly", "Replant basil in summer"]
  });
  
  const form = useForm({
    defaultValues: {
      name: "",
      width: 2,
      height: 2,
      task: ""
    }
  });
  
  // Add a new patch
  const handleAddPatch = (data: any) => {
    const newPatch: Patch = {
      id: `patch-${Date.now()}`,
      name: data.name,
      width: parseInt(data.width) || 2,
      height: parseInt(data.height) || 2,
    };
    
    setPatches([...patches, newPatch]);
    form.reset({ name: "", width: 2, height: 2, task: "" });
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
            width: parseInt(data.width) || 2, 
            height: parseInt(data.height) || 2 
          } 
        : patch
    ));
    
    setEditingPatchId(null);
    form.reset({ name: "", width: 2, height: 2, task: "" });
    toast.success("Patch updated");
  };
  
  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(editingPatchId ? handleSaveEdit : handleAddPatch)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
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
                    <FormLabel className="text-green-700">Width</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Height</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
                  <div className="font-medium text-green-800 flex items-center">
                    <Move className="h-4 w-4 mr-2 text-green-600" />
                    {patch.name}
                    <span className="ml-2 text-xs text-gray-500">
                      {patch.width}×{patch.height}
                    </span>
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
