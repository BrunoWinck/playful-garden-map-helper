
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export const TasksContent: React.FC = () => {
  // This component will be a placeholder for now since we don't yet have 
  // access to the tasks list component to reuse
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card className="p-4 bg-white">
            <p className="text-center text-gray-500">
              Tasks component will be integrated here.
            </p>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
