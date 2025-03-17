
import React, { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit, Move, Plus } from "lucide-react";
import { Patch } from "@/lib/types";

interface PatchCardProps {
  title: React.ReactNode;
  children: ReactNode;
  className?: string;
  patch?: Patch;
  tasks?: string[];
  onEdit?: (patch: Patch) => void;
  onDelete?: (patchId: string) => Promise<void>;
  onAddTask?: (patchId: string, task: string) => Promise<void>;
  onDeleteTask?: (patchId: string, taskIndex: number) => Promise<void>;
}

export const PatchCard = ({ 
  title,
  children,
  className = "",
  patch,
  tasks = [],
  onEdit,
  onDelete,
  onAddTask,
  onDeleteTask
}: PatchCardProps) => {
  const [taskInput, setTaskInput] = useState("");

  const handleAddTask = () => {
    if (taskInput.trim() && patch && onAddTask) {
      onAddTask(patch.id, taskInput);
      setTaskInput("");
    }
  };

  const getPatchTypeLabel = (type: string): string => {
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
    <div className={`border rounded-md ${className}`}>
      <div className="p-3 border-b bg-green-50">
        <div className="flex items-center justify-between">
          {title}
        </div>
      </div>
      <div className="p-3">
        {children}
      </div>
      
      {patch && (
        <div className="px-3 pb-3 mt-2 space-y-2">
          <div className="flex items-center">
            <Input 
              placeholder="Add a task for this patch" 
              className="text-sm h-8"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask();
                }
              }}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-1 h-8 w-8 text-green-700"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ul className="space-y-1 text-sm">
            {tasks.map((task, index) => (
              <li key={index} className="flex items-center justify-between py-1 px-2 rounded bg-white">
                <span>{task}</span>
                {onDeleteTask && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-red-500"
                    onClick={() => onDeleteTask(patch.id, index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
