
import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

type PlantItem = {
  id: string;
  name: string;
  icon: string;
  position?: { x: number; y: number };
};

const initialPlants: PlantItem[] = [
  { id: "tomato", name: "Tomato", icon: "🍅" },
  { id: "carrot", name: "Carrot", icon: "🥕" },
  { id: "lettuce", name: "Lettuce", icon: "🥬" },
  { id: "potato", name: "Potato", icon: "🥔" },
  { id: "cucumber", name: "Cucumber", icon: "🥒" },
];

export const GardenMap = () => {
  return (
    <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4 h-96 overflow-hidden">
      <p className="text-center text-green-700 mb-4">
        For a full interactive map, DnD (drag and drop) libraries are needed. This is a placeholder.
      </p>
      <div className="bg-brown-200 h-full rounded-lg p-4 flex flex-wrap gap-4 items-start justify-center">
        {initialPlants.map((plant) => (
          <div 
            key={plant.id}
            className="bg-white p-3 rounded-lg shadow-md cursor-move flex flex-col items-center"
          >
            <span className="text-3xl mb-2">{plant.icon}</span>
            <span className="text-sm text-green-800">{plant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
