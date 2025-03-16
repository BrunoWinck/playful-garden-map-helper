import React from "react";
import { ListTodo, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickQueryOptions({})
{

  const quickQueryOptions = [
    {
      label: "Check my tasks",
      icon: <ListTodo className="h-3.5 w-3.5 mr-1" />,
      color: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
      query: "Check if my plan for the next months is complete considering my location, climate, and garden state. Please review what's already done and planned, and suggest additional tasks with their timing.",
      instantSubmit: true
    },
    {
      label: "Urgent care needed?",
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
      color: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
      query: "Based on today's weather and the current state of my garden, are there any urgent actions I should take immediately? Please use the task format for recommendations.",
      instantSubmit: true
    },
    {
      label: "What's the procedure for...",
      icon: <HelpCircle className="h-3.5 w-3.5 mr-1" />,
      color: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200", 
      query: "What's the procedure for ",
      instantSubmit: false
    }
  ];
return <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity rounded-md">
  <div className="flex flex-wrap gap-2 justify-center p-2">
    {quickQueryOptions.map((option, index) => (
      <Button
        key={index}
        variant="outline"
        className={`text-xs py-1 px-3 h-auto ${option.color}`}
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
        {option.label}
      </Button>
    ))}
    </div>
  </div>;
}