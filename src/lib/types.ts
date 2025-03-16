export type CareTask = {
  id: string;
  plant: string;
  task: string;
  dueDate: string;
  date?: Date;
  completed: boolean;
};

export type PlantItem = {
  id: string;
  name: string;
  icon: string;
  category: string;
  position?: { x: number; y: number; patchId?: string };
};

