import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, ListTodo, Trash2 } from "lucide-react";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface GardenTask {
  id: string;
  task: string;
  completed: boolean;
  created_at: string;
  patch_id?: string;
  patch_name?: string;
}

export const TasksContent: React.FC = ({careTasks}) => {

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
          patch_id: "general"
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save task to database:", error);
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

  useEffect(() => {
    const onAddTask = e => {
      console.log( "addTask", e);
      addTask( e.detail.task, e.detail.timing);
    };
    window.addEventListener('addTask', onAddTask);
    return () => window.removeEventListener('addTask',onAddTask);
  }, []);

  const handleAddTask = async () => {
    if (!newTask.trim() || !newTiming.trim()) {
      toast.error("Both task and timing are required.");
      return;
    }

    addTask( newTask, newTiming);
  };
  
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
  </div>
}

export const TasksContentSorted: React.FC = () => {
  const [tasks, setTasks] = useState<GardenTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        
        // Query tasks from patch_tasks table
        const { data, error } = await supabase
          .from('patch_tasks')
          .select(`
            *,
            patches(name)
          `)
          .eq('user_id', ANONYMOUS_USER_ID)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to include patch name
        const formattedTasks = data.map((task) => ({
          ...task,
          patch_name: task.patches?.name || 'General'
        }));

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // Use some mock data if fetching fails
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
  }, []);

  
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      // Find the task
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      // Update in local state for immediate UI feedback
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, completed: !task.completed } 
            : task
        )
      );

      // Update in database
      const { error } = await supabase
        .from('patch_tasks')
        .update({ completed: !taskToUpdate.completed })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(`Task marked as ${!taskToUpdate.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task status");
      
      // Revert changes in case of error
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
      // Delete from database
      const { error } = await supabase
        .from('patch_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
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
                                    {new Date(task.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
    </div>
  );
};
