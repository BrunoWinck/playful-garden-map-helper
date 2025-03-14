
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

type CareTask = {
  id: string;
  plant: string;
  task: string;
  dueDate: string;
  completed: boolean;
};

const careTasks: CareTask[] = [
  {
    id: "1",
    plant: "Tomato",
    task: "Water plants",
    dueDate: "Today",
    completed: false
  },
  {
    id: "2",
    plant: "Lettuce",
    task: "Add fertilizer",
    dueDate: "Tomorrow",
    completed: false
  },
  {
    id: "3",
    plant: "Carrot",
    task: "Remove weeds",
    dueDate: "Today",
    completed: true
  },
  {
    id: "4",
    plant: "Cucumber",
    task: "Check for pests",
    dueDate: "In 2 days",
    completed: false
  }
];

export const CareSchedule = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-green-800">Tasks</h3>
        <button className="text-blue-600 flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          View Calendar
        </button>
      </div>
      
      <div className="space-y-3">
        {careTasks.map((task) => (
          <div 
            key={task.id} 
            className={`p-3 rounded-lg border ${
              task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-green-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox 
                id={`task-${task.id}`} 
                checked={task.completed}
              />
              <div className="flex-1">
                <label 
                  htmlFor={`task-${task.id}`}
                  className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-green-800'}`}
                >
                  {task.task}
                </label>
                <div className="text-sm text-gray-500 mt-1">
                  {task.plant} • Due {task.dueDate}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
