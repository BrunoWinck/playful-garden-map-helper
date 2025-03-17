
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TasksContent } from "./TasksContent";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { careTasks } from "@/lib/mockdata";
import { getCurrentUser } from "@/services/profileService";

export const TaskList = () => {
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = React.useState(false);
  const [newTask, setNewTask] = React.useState("");
  const [newTaskTiming, setNewTaskTiming] = React.useState("");

  const handleAddTask = () => {
    if (!newTask.trim()) {
      toast.error("Task cannot be empty");
      return;
    }

    if (!newTaskTiming.trim()) {
      toast.error("Please specify when the task should be done");
      return;
    }

    // Create custom event to trigger the addTask function in TasksContent
    const addTaskEvent = new CustomEvent('addTask', {
      detail: { task: newTask, timing: newTaskTiming }
    });
    window.dispatchEvent(addTaskEvent);

    // Reset form and close drawer
    setNewTask("");
    setNewTaskTiming("");
    setIsTaskDrawerOpen(false);
    toast.success("Task added successfully");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-green-800">Garden Tasks</h3>
        <Drawer open={isTaskDrawerOpen} onOpenChange={setIsTaskDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 bg-green-50 border-green-200 hover:bg-green-100 text-green-800">
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-sm">Add Task</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-w-md mx-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-medium">Add New Garden Task</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <Input 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">When to do it</label>
                <Input 
                  value={newTaskTiming}
                  onChange={(e) => setNewTaskTiming(e.target.value)}
                  placeholder="Today, Tomorrow, In 2 days, etc."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button onClick={handleAddTask}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Task
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TasksContent careTasks={careTasks} />
      </div>
    </div>
  );
};
