
export type CareTask = {
  id: string;
  plant: string;
  task: string;
  dueDate: string;
  date?: Date;
  completed: boolean;
};

export type PlantGrowthStage = "seed" | "sprout" | "young" | "ready" | "mature";

export type PlantItem = {
  id: string;
  name: string;
  icon: string;
  category: string;
  lifecycle?: string;
  parent_id?: string;
  position?: { x: number; y: number; patchId?: string };
  stage?: PlantGrowthStage;
};

export type PatchType = "outdoor-soil" | "perennials" | "indoor" | "protected" | "template";
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
  containingPatchId?: string; // New field to indicate parent patch
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
  containingPatchId?: string; // New field for parent patch
  task?: string;
};
