
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit, Move } from "lucide-react";
import { Patch } from "@/lib/types";

interface PatchCardProps {
  patch: Patch;
  tasks: string[];
  onEdit: (patch: Patch) => void;
  onDelete: (patchId: string) => Promise<void>;
  onAddTask: (patchId: string, task: string) => Promise<void>;
  onDeleteTask: (patchId: string, taskIndex: number) => Promise<void>;
}

export const PatchCard = ({ 
  patch, 
  tasks, 
  onEdit, 
  onDelete, 
  onAddTask, 
  onDeleteTask 
}: PatchCardProps) => {
  const [taskInput, setTaskInput] = useState("");

  const handleAddTask = () => {
    if (taskInput.trim()) {
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
    <div className="border rounded-md p-3 bg-green-50">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-green-800">
          <div className="flex items-center">
            <Move className="h-4 w-4 mr-2 text-green-600" />
            {patch.name}
          </div>
          <div className="text-xs text-gray-600 mt-1 space-y-1">
            <div>
              <span className="inline-block w-24">Size:</span>
              <span className="font-normal">
                {patch.length}×{patch.width}m
              </span>
            </div>
            <div>
              <span className="inline-block w-24">Type:</span>
              <span className="font-normal">
                {getPatchTypeLabel(patch.type)}
              </span>
            </div>
            {patch.placementType === "slots" && (
              <div>
                <span className="inline-block w-24">Slots:</span>
                <span className="font-normal">
                  {patch.slotsLength || 4}×{patch.slotsWidth || 6} 
                  ({(patch.slotsLength || 4) * (patch.slotsWidth || 6)} total)
                </span>
              </div>
            )}
            <div>
              <span className="inline-block w-24">Natural Light:</span>
              <span className="font-normal">
                {patch.naturalLightPercentage}%
              </span>
            </div>
            <div className="flex space-x-3">
              {patch.heated && (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                  Heated
                </span>
              )}
              {patch.artificialLight && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  Artificial Light
                </span>
              )}
              {patch.placementType === "slots" && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                  Seed Tray
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-amber-600"
            onClick={() => onEdit(patch)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-600"
            onClick={() => onDelete(patch.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 space-y-2">
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
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ul className="space-y-1 text-sm">
          {tasks.map((task, index) => (
            <li key={index} className="flex items-center justify-between py-1 px-2 rounded bg-white">
              <span>{task}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-red-500"
                onClick={() => onDeleteTask(patch.id, index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
