
import React, { useEffect, useState } from "react";
import { Plus, Tree, Flower } from "lucide-react";
import { PlantItem } from "@/lib/types";
import { DraggablePlant } from "./DraggablePlant";
import { PlantFilter } from "./PlantFilter";
import { fetchPlants, createPlant } from "@/services/plantService";
import { initialPlants } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
  const [activeTab, setActiveTab] = useState("all");
  
  // New plant dialog state
  const [newPlantDialogOpen, setNewPlantDialogOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantIcon, setNewPlantIcon] = useState("🌱");
  const [newPlantCategory, setNewPlantCategory] = useState("vegetable");
  
  // Common plant icons for selection
  const plantIcons = ["🌱", "🌿", "🍀", "🌵", "🌲", "🌳", "🌴", "🍂", "🍃", "🍄", "🍅", "🍆", "🥑", "🥕", "🥔", "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🥝", "🌷", "🌸", "🌹", "🌺", "🌻", "🌼", "🪷"];
  
  // Load plants from database
  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const dbPlants = await fetchPlants();
      if (dbPlants && dbPlants.length > 0) {
        setPlants(dbPlants);
      } else {
        // Fallback to initial plants if database fetch fails
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

  // Handle creating a new plant
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
  
  // Filter plants based on category, search term, and active tab
  const getFilteredPlants = () => {
    return plants.filter(plant => {
      // First filter by tab
      let passesTabFilter = true;
      if (activeTab === "trees") {
        passesTabFilter = plant.category === "tree";
      } else if (activeTab === "shrubs") {
        passesTabFilter = plant.category === "shrub";
      } else if (activeTab === "standard") {
        passesTabFilter = !["tree", "shrub"].includes(plant.category);
      }
      
      // Then filter by category (if applied)
      const matchesCategory = !categoryFilter || plant.category === categoryFilter;
      
      // Finally filter by search term
      const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return passesTabFilter && matchesCategory && matchesSearch;
    });
  };

  const filteredPlants = getFilteredPlants();

  return (
    <div className="border-2 border-brown-300 bg-brown-100 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-green-800">Available Plants</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => setNewPlantDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Plant
        </Button>
      </div>
      
      <Tabs defaultValue="standard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-3 bg-brown-200 w-full grid grid-cols-3">
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="trees" className="flex items-center">
            <Tree className="h-4 w-4 mr-1" /> Trees
          </TabsTrigger>
          <TabsTrigger value="shrubs" className="flex items-center">
            <Flower className="h-4 w-4 mr-1" /> Shrubs
          </TabsTrigger>
        </TabsList>
        
        <PlantFilter 
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        <TabsContent value="all" className="mt-0">
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-80 overflow-y-auto">
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
              <p className="text-center w-full py-8 text-gray-500">No plants match your search.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="standard" className="mt-0">
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-80 overflow-y-auto">
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
              <p className="text-center w-full py-8 text-gray-500">No standard plants match your filters.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="trees" className="mt-0">
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-80 overflow-y-auto">
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
              <p className="text-center w-full py-8 text-gray-500">No trees match your filters.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="shrubs" className="mt-0">
          <div className="flex flex-wrap gap-4 justify-center bg-brown-200 p-3 rounded-lg max-h-80 overflow-y-auto">
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
              <p className="text-center w-full py-8 text-gray-500">No shrubs match your filters.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Plant Dialog */}
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
