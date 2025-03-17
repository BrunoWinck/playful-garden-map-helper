
import React, { useState, useEffect } from "react";
import { Book, Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlossaryContent } from "./GlossaryContent";
import { AdviceContent } from "./AdviceContent";
import { Widget } from "./Widget";

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

  const tabsContent = (
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
      
      <div className="flex-1 overflow-hidden mt-4">
        <TabsContent value="glossary" className="h-full m-0 overflow-hidden">
          <GlossaryContent />
        </TabsContent>
        
        <TabsContent value="advices" className="h-full m-0 overflow-hidden">
          <AdviceContent />
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <Widget
      title="Garden Knowledge Base"
      icon={Book}
      isLoading={isLoading}
      loadingText="Loading knowledge base..."
      footer={
        <div className="text-xs text-gray-500 justify-center w-full text-center">
          {activeTab === "glossary" && "Garden terminology reference"}
          {activeTab === "advices" && "Saved gardening tips and advice"}
        </div>
      }
      contentClassName="p-0"
    >
      {tabsContent}
    </Widget>
  );
};
