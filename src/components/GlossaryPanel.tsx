
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { GlossaryContent } from "./GlossaryContent";
import { AdviceContent } from "./AdviceContent";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
  updated_at?: string;
}

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
          <TabsList className="mx-0 mt-3 bg-green-100 justify-between w-full grid grid-cols-2 p-0">
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
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="p-3 border-t text-xs text-gray-500 justify-center">
        {activeTab === "glossary" && "Garden terminology reference"}
        {activeTab === "advices" && "Saved gardening tips and advice"}
      </CardFooter>
    </Card>
  );
};
