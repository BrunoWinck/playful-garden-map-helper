
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Book, Save, X, Trash2, Bookmark, ListTodo } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlossaryContent } from "./GlossaryContent";
import { AdviceContent } from "./AdviceContent";
import { TasksContent } from "./TasksContent";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
  updated_at?: string;
}

import { careTasks } from "@/lib/mockdata.ts";

export const GlossaryPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("glossary");
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTaskTiming, setNewTaskTiming] = useState("");
  
  useEffect(() => {
    // Just set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Listen for tab activation events
    const onActivateTab = (e: CustomEvent) => {
      console.log("Activating tab:", e.detail.tab);
      setActiveTab(e.detail.tab);
    };
    
    window.addEventListener('activateTab', onActivateTab as EventListener);
    
    return () => {
      window.removeEventListener('activateTab', onActivateTab as EventListener);
    };
  }, []);

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

  // Render loading state
  if (isLoading) {
    return (
      <Card className="flex flex-col h-full border-green-200 bg-green-50">
        <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
          <CardTitle className="flex items-center text-lg">
            <Book className="mr-2 h-5 w-5" />
            Garden Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center flex-1 p-8">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border-green-200 bg-green-50">
      <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
        <CardTitle className="flex items-center text-lg">
          <Book className="mr-2 h-5 w-5" />
          Garden Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <Tabs 
          defaultValue="glossary" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <TabsList className="mx-0 mt-3 bg-green-100 justify-between w-full grid grid-cols-3 p-0">
            <TabsTrigger 
              id="glossary-tab"
              value="glossary" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800 px-1 py-1.5 text-xs sm:text-sm"
            >
              <Book className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              Glossary
            </TabsTrigger>
            <TabsTrigger 
              value="advices" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800 px-1 py-1.5 text-xs sm:text-sm"
            >
              <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              Advices
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800 px-1 py-1.5 text-xs sm:text-sm"
            >
              <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="glossary" className="h-full m-0 overflow-hidden">
              <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
                <GlossaryContent />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="advices" className="h-full m-0 overflow-hidden">
              <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
                <AdviceContent />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tasks" className="h-full m-0 overflow-hidden">
              <div className="p-3 bg-white border-b flex justify-between items-center">
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
              <ScrollArea className="h-full max-h-[calc(100vh-340px)]">
                <TasksContent careTasks={careTasks}/>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="p-3 border-t text-xs text-gray-500 justify-center">
        {activeTab === "glossary" && "Garden terminology reference"}
        {activeTab === "advices" && "Saved gardening tips and advice"}
        {activeTab === "tasks" && "Garden tasks and reminders"}
      </CardFooter>
    </Card>
  );
};
