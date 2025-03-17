
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
  parent_id?: string;
  position?: { x: number; y: number; patchId?: string };
};

export type PatchType = "outdoor-soil" | "perennials" | "indoor" | "protected";
export type PlacementType = "free" | "slots";

export type Patch = {
  id: string;
  name: string;
  width: number;
  height: number;
  length: number; // For backward compatibility
  type: PatchType;
  placementType: PlacementType;
  slotsLength: number;
  slotsWidth: number;
  heated: boolean;
  artificialLight: boolean;
  naturalLightPercentage: number;
};

export type PatchFormValues = {
  name: string;
  length: number;
  width: number;
  type: PatchType;
  heated: boolean;
  artificialLight: boolean;
  naturalLightPercentage: number;
  placementType: PlacementType;
  slotsLength: number;
  slotsWidth: number;
  task?: string;
};
