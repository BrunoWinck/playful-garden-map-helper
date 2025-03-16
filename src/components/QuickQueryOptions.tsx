
import React from "react";
import { ListTodo, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickQueryOptionsProps {
  setInput: (input: string) => void;
  handleSubmit: (event: any) => void;
  setIsInputFocused: (focused: boolean) => void;
}

export function QuickQueryOptions({ setInput, handleSubmit, setIsInputFocused }: QuickQueryOptionsProps) {
  const quickQueryOptions = [
    {
      label: "Check my tasks",
      icon: <ListTodo className="h-3 w-3" />,
      color: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
      query: "Check if my plan for the next months is complete considering my location, climate, and garden state. Please review what's already done and planned, and suggest additional tasks with their timing.",
      instantSubmit: true
    },
    {
      label: "Urgent care needed?",
      icon: <AlertTriangle className="h-3 w-3" />,
      color: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
      query: "Based on today's weather and the current state of my garden, are there any urgent actions I should take immediately? Please use the task format for recommendations.",
      instantSubmit: true
    },
    {
      label: "What's the procedure for...",
      icon: <HelpCircle className="h-3 w-3" />,
      color: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200", 
      query: "What's the procedure for ",
      instantSubmit: false
    }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm transition-opacity rounded-b-md border-t border-gray-100">
      <div className="flex flex-wrap gap-1 justify-center p-1.5">
        {quickQueryOptions.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className={`text-xs py-0.5 px-2 h-6 ${option.color}`}
            onClick={() => {
              setInput(option.query);
              if (option.instantSubmit) {
                setTimeout(() => {
                  handleSubmit(new Event('submit') as any);
                }, 100);
              } else {
                setIsInputFocused(true);
                setTimeout(() => {
                  document.querySelector('textarea')?.focus();
                }, 100);
              }
            }}
          >
            {option.icon}
            <span className="ml-0.5">{option.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
