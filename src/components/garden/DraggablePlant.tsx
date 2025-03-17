
import React from "react";
import { useDrag } from "react-dnd";
import { PlantItem } from "@/lib/types";
import { ItemTypes } from "./GardenCell";

interface DraggablePlantProps {
  plant: PlantItem;
}

export const DraggablePlant = ({ plant }: DraggablePlantProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PLANT,
    item: plant,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white p-3 rounded-lg shadow-md cursor-move flex flex-col items-center ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="text-3xl mb-2">{plant.icon}</span>
      <span className="text-sm text-green-800">{plant.name}</span>
    </div>
  );
};
