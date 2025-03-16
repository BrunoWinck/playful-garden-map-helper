
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { CareTask } from "@/lib/types";

// Convert string dates to actual Date objects for the tasks
export const careTasks: CareTask[] = [
  {
    id: "1",
    plant: "Tomato",
    task: "Water plants",
    dueDate: "Today",
    date: new Date(),
    completed: false
  },
  {
    id: "2",
    plant: "Lettuce",
    task: "Add fertilizer",
    dueDate: "Tomorrow",
    date: addDays(new Date(), 1),
    completed: false
  },
  {
    id: "3",
    plant: "Carrot",
    task: "Remove weeds",
    dueDate: "Today",
    date: new Date(),
    completed: true
  },
  {
    id: "4",
    plant: "Cucumber",
    task: "Check for pests",
    dueDate: "In 2 days",
    date: addDays(new Date(), 2),
    completed: false
  },
  {
    id: "5",
    plant: "Pepper",
    task: "Prune leaves",
    dueDate: "In 3 days",
    date: addDays(new Date(), 3),
    completed: false
  },
  {
    id: "6",
    plant: "Eggplant",
    task: "Apply organic pesticide",
    dueDate: "In 5 days",
    date: addDays(new Date(), 5),
    completed: false
  }
];
