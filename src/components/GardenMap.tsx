
import React, { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Define our item types for DnD
const ItemTypes = {
  PLANT: 'plant',
};

type PlantItem = {
  id: string;
  name: string;
  icon: string;
  position?: { x: number; y: number };
};

// Define a Garden Grid cell
interface CellProps {
  x: number;
  y: number;
  onDrop: (item: PlantItem, x: number, y: number) => void;
  plantItem?: PlantItem;
}

// Garden Grid Cell component
const Cell = ({ x, y, onDrop, plantItem }: CellProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PLANT,
    drop: (item: PlantItem) => onDrop(item, x, y),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-16 h-16 border border-brown-400 ${
        isOver ? "bg-green-200" : "bg-brown-100"
      } rounded-md flex items-center justify-center transition-colors`}
    >
      {plantItem && (
        <div className="flex flex-col items-center">
          <span className="text-3xl">{plantItem.icon}</span>
          <span className="text-xs text-green-800">{plantItem.name}</span>
        </div>
      )}
    </div>
  );
};

// Draggable Plant component
const DraggablePlant = ({ plant }: { plant: PlantItem }) => {
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

const initialPlants: PlantItem[] = [
  { id: "tomato", name: "Tomato", icon: "🍅" },
  { id: "carrot", name: "Carrot", icon: "🥕" },
  { id: "lettuce", name: "Lettuce", icon: "🥬" },
  { id: "potato", name: "Potato", icon: "🥔" },
  { id: "cucumber", name: "Cucumber", icon: "🥒" },
  { id: "pepper", name: "Pepper", icon: "🫑" },
  { id: "corn", name: "Corn", icon: "🌽" },
  { id: "eggplant", name: "Eggplant", icon: "🍆" },
];

export const GardenMap = () => {
  // Create a 6x6 garden grid
  const gridSize = 6;
  
  // Track where plants are placed in the garden
  const [gardenGrid, setGardenGrid] = useState<(PlantItem | undefined)[][]>(
    Array(gridSize).fill(null).map(() => Array(gridSize).fill(undefined))
  );

  // Handle plant drop on a grid cell
  const handleDrop = (item: PlantItem, x: number, y: number) => {
    // Make a deep copy of the current grid
    const newGrid = gardenGrid.map(row => [...row]);
    
    // Place the plant in the new cell
    newGrid[y][x] = { ...item, position: { x, y } };
    
    setGardenGrid(newGrid);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-6">
        <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Garden Grid</h3>
          <div className="grid grid-cols-6 gap-1 bg-brown-200 p-3 rounded-lg">
            {gardenGrid.map((row, y) =>
              row.map((cell, x) => (
                <Cell
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  onDrop={handleDrop}
                  plantItem={cell}
                />
              ))
            )}
          </div>
        </div>
        
        <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Available Plants</h3>
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg">
            {initialPlants.map((plant) => (
              <DraggablePlant key={plant.id} plant={plant} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
