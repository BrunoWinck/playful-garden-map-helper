
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

import { careTasks } from "@/lib/mockData.ts";

export const GlossaryPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("glossary");
  
  useEffect(() => {
    // Just set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Book className="mr-2 h-5 w-5" />
            Garden Knowledge Base
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs 
          defaultValue="glossary" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <TabsList className="mx-4 mt-3 bg-green-100 justify-between">
            <TabsTrigger 
              value="glossary" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800"
            >
              <Book className="h-4 w-4 mr-1" />
              Glossary
            </TabsTrigger>
            <TabsTrigger 
              value="advices" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              Advices
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-white data-[state=active]:text-green-800"
            >
              <ListTodo className="h-4 w-4 mr-1" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="glossary" className="h-full m-0">
              <GlossaryContent />
            </TabsContent>
            
            <TabsContent value="advices" className="h-full m-0">
              <AdviceContent />
            </TabsContent>
            
            <TabsContent value="tasks" className="h-full m-0">
              <TasksContent careTasks={careTasks}/>
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
