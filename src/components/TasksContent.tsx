import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, ListTodo, Trash2, Pencil } from "lucide-react";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CareTask } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GardenTask {
  id: string;
  task: string;
  completed: boolean;
  created_at: string;
  patch_id?: string;
  patch_name?: string;
  plant?: string;
  dueDate?: string;
}

interface TasksContentProps {
  careTasks?: CareTask[];
}

export const TasksContent: React.FC<TasksContentProps> = ({ careTasks = [] }) => {
  const [tasks, setTasks] = useState<GardenTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newTask, setNewTask] = useState("");
  const [newTiming, setNewTiming] = useState("");
  const [editingTask, setEditingTask] = useState<GardenTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('patch_tasks')
          .select(`
            *,
            patches(name)
          `)
          .eq('user_id', ANONYMOUS_USER_ID)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTasks = data.map((task) => ({
          ...task,
          patch_name: task.patches?.name || 'General'
        }));

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([
          {
            id: "1",
            task: "Water the tomatoes",
            completed: false,
            created_at: new Date().toISOString(),
            patch_id: "patch1",
            patch_name: "Vegetable Garden"
          },
          {
            id: "2",
            task: "Apply compost to flower beds",
            completed: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            patch_id: "patch2",
            patch_name: "Flower Bed"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
    
    if (careTasks.length > 0) {
      const careTasksFormatted: GardenTask[] = careTasks.map(task => ({
        id: task.id,
        task: task.task,
        completed: task.completed,
        created_at: new Date().toISOString(),
        patch_name: task.plant,
        plant: task.plant,
        dueDate: task.dueDate
      }));
      
      setTasks(prev => [...prev, ...careTasksFormatted]);
    }
  }, [careTasks]);

  const addTask = (task: string, timing: string) => {
    try {
      const storedTasks = localStorage.getItem('garden-tasks');
      const tasks: {id: string, text: string, completed: boolean, createdAt: string}[] = 
        storedTasks ? JSON.parse(storedTasks) : [];
      
      if (tasks.some(t => t.text.toLowerCase() === task.toLowerCase())) {
        return;
      }
      
      const newTask = {
        id: crypto.randomUUID(),
        text: task,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      tasks.push(newTask);
      localStorage.setItem('garden-tasks', JSON.stringify(tasks));
      
      supabase
        .from('patch_tasks')
        .insert({
          task: task,
          user_id: ANONYMOUS_USER_ID,
          patch_id: crypto.randomUUID()
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save task to database:", error);
          } else {
            fetchTasks();
          }
        });
      
      toast.success(`Added "${task}" to your garden tasks`, {
        action: {
          label: "View Tasks",
          onClick: () => {
          }
        }
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('patch_tasks')
        .select(`
          *,
          patches(name)
        `)
        .eq('user_id', ANONYMOUS_USER_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks = data.map((task) => ({
        ...task,
        patch_name: task.patches?.name || 'General'
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  };

  useEffect(() => {
    const onAddTask = (e: CustomEvent) => {
      console.log("addTask", e);
      addTask(e.detail.task, e.detail.timing);
    };
    window.addEventListener('addTask', onAddTask as EventListener);
    return () => window.removeEventListener('addTask', onAddTask as EventListener);
  }, []);

  const handleAddTask = async () => {
    if (!newTask.trim() || !newTiming.trim()) {
      toast.error("Both task and timing are required.");
      return;
    }

    addTask(newTask, newTiming);
  };
  
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, completed: !task.completed } 
            : task
        )
      );

      const { error } = await supabase
        .from('patch_tasks')
        .update({ completed: !taskToUpdate.completed })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(`Task marked as ${!taskToUpdate.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status");
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed: tasks.find(t => t.id === taskId)?.completed || false } : task
        )
      );
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('patch_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const openEditDialog = (task: GardenTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const saveEditedTask = async () => {
    if (!editingTask) return;
    
    try {
      const { error } = await supabase
        .from('patch_tasks')
        .update({ task: editingTask.task })
        .eq('id', editingTask.id);

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === editingTask.id 
            ? { ...task, task: editingTask.task } 
            : task
        )
      );
      
      setIsEditDialogOpen(false);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const confirmDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const groupTasksByPatch = () => {
    const grouped: Record<string, GardenTask[]> = {};
    
    tasks.forEach(task => {
      const patchName = task.patch_name || 'General';
      if (!grouped[patchName]) {
        grouped[patchName] = [];
      }
      grouped[patchName].push(task);
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <div className="animate-spin h-6 w-6 border-4 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const groupedTasks = groupTasksByPatch();
  const patchNames = Object.keys(groupedTasks);

  if (tasks.length === 0 && careTasks.length > 0) {
    return <div className="space-y-3">
      {careTasks.map((task) => (
        <div 
          key={task.id} 
          className={`p-3 rounded-lg border ${
            task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-green-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <Checkbox 
              id={`task-${task.id}`} 
              checked={task.completed}
            />
            <div className="flex-1">
              <label 
                htmlFor={`task-${task.id}`}
                className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-green-800'}`}
              >
                {task.task}
              </label>
              <div className="text-sm text-gray-500 mt-1">
                {task.plant} • Due {task.dueDate}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {tasks.length === 0 ? (
            <Card className="p-4 bg-white">
              <div className="text-center text-gray-500">
                <ListTodo className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p>No garden tasks yet</p>
                <p className="text-sm mt-1">
                  Tasks from Garden Advisor will appear here
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {patchNames.map(patchName => (
                <Collapsible key={patchName} defaultOpen={true}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 p-2 px-3 rounded-t-lg">
                      <h3 className="font-medium text-green-800">{patchName}</h3>
                      <span className="text-xs text-green-700 bg-white px-2 py-1 rounded-full">
                        {groupedTasks[patchName].length} tasks
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-0 pt-0 border-t-0 rounded-t-none">
                      <div className="divide-y divide-gray-100">
                        {groupedTasks[patchName].map(task => (
                          <div 
                            key={task.id} 
                            className={`p-3 flex items-start justify-between group ${
                              task.completed ? 'bg-gray-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <Button
                                size="sm"
                                variant={task.completed ? "default" : "outline"}
                                className={`h-6 w-6 p-0 rounded-full ${
                                  task.completed ? 'bg-green-600 text-white' : 'border-gray-300'
                                }`}
                                onClick={() => toggleTaskCompletion(task.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <div className="flex-1">
                                <p className={`text-sm ${
                                  task.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                                }`}>
                                  {task.task}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {task.dueDate || new Date(task.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center opacity-100 group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 mr-1"
                                onClick={() => openEditDialog(task)}
                              >
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => confirmDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Description</label>
              <Input 
                value={editingTask?.task || ""}
                onChange={(e) => setEditingTask(editingTask ? {...editingTask, task: e.target.value} : null)}
                placeholder="What needs to be done?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
