
import { PlantItem } from "@/lib/types";

// This array is now just a fallback in case the database call fails
export const initialPlants: PlantItem[] = [
  // Vegetables
  { id: crypto.randomUUID(), name: "Tomato", icon: "🍅", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Carrot", icon: "🥕", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Lettuce", icon: "🥬", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Potato", icon: "🥔", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Cucumber", icon: "🥒", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Pepper", icon: "🫑", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Corn", icon: "🌽", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Eggplant", icon: "🍆", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Broccoli", icon: "🥦", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Onion", icon: "🧅", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Garlic", icon: "🧄", category: "vegetable" },
  { id: crypto.randomUUID(), name: "Pumpkin", icon: "🎃", category: "vegetable" },
  
  // Fruits (non-tree)
  { id: crypto.randomUUID(), name: "Watermelon", icon: "🍉", category: "fruit" },
  { id: crypto.randomUUID(), name: "Grapes", icon: "🍇", category: "fruit" },
  { id: crypto.randomUUID(), name: "Strawberry", icon: "🍓", category: "fruit" },
  { id: crypto.randomUUID(), name: "Blueberry", icon: "🫐", category: "fruit" },
  
  // Herbs
  { id: crypto.randomUUID(), name: "Basil", icon: "🌿", category: "herb" },
  { id: crypto.randomUUID(), name: "Mint", icon: "🌱", category: "herb" },
  { id: crypto.randomUUID(), name: "Rosemary", icon: "🌿", category: "herb" },
  { id: crypto.randomUUID(), name: "Thyme", icon: "🌱", category: "herb" },
  { id: crypto.randomUUID(), name: "Cilantro", icon: "🌿", category: "herb" },
  { id: crypto.randomUUID(), name: "Sage", icon: "🌱", category: "herb" },
  
  // Flowers
  { id: crypto.randomUUID(), name: "Rose", icon: "🌹", category: "flower" },
  { id: crypto.randomUUID(), name: "Tulip", icon: "🌷", category: "flower" },
  { id: crypto.randomUUID(), name: "Sunflower", icon: "🌻", category: "flower" },
  { id: crypto.randomUUID(), name: "Daisy", icon: "🌼", category: "flower" },
  { id: crypto.randomUUID(), name: "Hibiscus", icon: "🌺", category: "flower" },
  { id: crypto.randomUUID(), name: "Lotus", icon: "🪷", category: "flower" },
  
  // Trees (including tree fruits)
  { id: crypto.randomUUID(), name: "Apple", icon: "🍎", category: "tree" },
  { id: crypto.randomUUID(), name: "Pear", icon: "🍐", category: "tree" },
  { id: crypto.randomUUID(), name: "Orange", icon: "🍊", category: "tree" },
  { id: crypto.randomUUID(), name: "Lemon", icon: "🍋", category: "tree" },
  { id: crypto.randomUUID(), name: "Peach", icon: "🍑", category: "tree" },
  { id: crypto.randomUUID(), name: "Banana", icon: "🍌", category: "tree" },
  { id: crypto.randomUUID(), name: "Avocado", icon: "🥑", category: "tree" },
];
