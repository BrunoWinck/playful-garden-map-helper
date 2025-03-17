
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

export type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
  type?: string;
  placementType?: "free" | "slots";
  slotsLength?: number;
  slotsWidth?: number;
  heated?: boolean;
  artificialLight?: boolean;
  naturalLightPercentage?: number;
};
