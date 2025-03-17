import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PlantItem } from "@/lib/types";
import { DraggablePlant } from "./DraggablePlant";
import { PlantFilter } from "./PlantFilter";
import { fetchPlants, createPlant } from "@/services/plantService";
import { initialPlants } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface PlantCatalogProps {
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const PlantCatalog = ({ 
  categoryFilter, 
  setCategoryFilter, 
  searchTerm, 
  setSearchTerm 
}: PlantCatalogProps) => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newPlantDialogOpen, setNewPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantIcon, setNewPlantIcon] = useState("🌱");
  const [newPlantCategory, setNewPlantCategory] = useState("vegetable");
  
  const plantIcons = ["🌱", "🌿", "🍀", "🌵", "🌲", "🌳", "🌴", "🍂", "🍃", "🍄", "🍅", "🍆", "🥑", "🥕", "🥔", "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🥝", "🌷", "🌸", "🌹", "🌺", "🌻", "🌼", "🪷"];
  
  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const dbPlants = await fetchPlants();
      if (dbPlants && dbPlants.length > 0) {
        setPlants(dbPlants);
      } else {
        setPlants(initialPlants);
      }
    } catch (error) {
      console.error("Error loading plants:", error);
      setPlants(initialPlants);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPlants();
  }, []);

  const handleCreatePlant = async () => {
    if (!newPlantName.trim()) {
      return;
    }

    try {
      const result = await createPlant({
        name: newPlantName.trim(),
        icon: newPlantIcon,
        category: newPlantCategory
      });

      if (result) {
        setNewPlantDialogOpen(false);
        setNewPlantName("");
        setNewPlantIcon("🌱");
        setNewPlantCategory("vegetable");
        await loadPlants();
      }
    } catch (error) {
      console.error("Error creating plant:", error);
    }
  };
  
  const filteredPlants = plants.filter(plant => {
    const matchesCategory = !categoryFilter || plant.category === categoryFilter;
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-green-800">Plants</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => setNewPlantDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Plant
        </Button>
      </div>
      
      <PlantFilter 
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      
      <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-[calc(100%-6rem)] overflow-y-auto mt-2">
        {isLoading ? (
          Array(8).fill(0).map((_, index) => (
            <div key={index} className="flex flex-col items-center w-20">
              <Skeleton className="w-12 h-12 rounded-full mb-2" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))
        ) : filteredPlants.length > 0 ? (
          filteredPlants.map((plant) => (
            <DraggablePlant 
              key={plant.id} 
              plant={plant} 
              onPlantUpdated={loadPlants} 
            />
          ))
        ) : (
          <p className="text-center w-full py-8 text-gray-500">No plants match your filters.</p>
        )}
      </div>
      
      <Dialog open={newPlantDialogOpen} onOpenChange={setNewPlantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Plant</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input 
                id="name" 
                value={newPlantName} 
                onChange={(e) => setNewPlantName(e.target.value)} 
                className="col-span-3"
                placeholder="Plant name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="icon" className="text-right">Icon</label>
              <Select value={newPlantIcon} onValueChange={setNewPlantIcon}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an icon">
                    <span className="text-2xl mr-2">{newPlantIcon}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-6 gap-1 p-1">
                    {plantIcons.map((icon) => (
                      <Button 
                        key={icon} 
                        variant="ghost" 
                        className="text-2xl p-1 h-10 w-10"
                        onClick={() => setNewPlantIcon(icon)}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">Category</label>
              <Select value={newPlantCategory} onValueChange={setNewPlantCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetable">Vegetable</SelectItem>
                  <SelectItem value="fruit">Fruit</SelectItem>
                  <SelectItem value="herb">Herb</SelectItem>
                  <SelectItem value="flower">Flower</SelectItem>
                  <SelectItem value="tree">Tree</SelectItem>
                  <SelectItem value="shrub">Shrub</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlantDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlant}>Create Plant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
