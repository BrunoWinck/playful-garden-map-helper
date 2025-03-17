
import { PlantItem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fetch all plants from database
export const fetchPlants = async (): Promise<PlantItem[]> => {
  try {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('name');
      
    if (error) {
      throw error;
    }
    
    // Adjust categories - ensure proper classification
    return data.map(plant => {
      // List of fruits that should be trees
      const treeFruits = ['apple', 'pear', 'orange', 'lemon', 'peach', 'banana', 'avocado'];
      
      // Check if we need to reclassify this plant as a tree
      if (plant.category === 'fruit' && treeFruits.some(tf => plant.name.toLowerCase().includes(tf.toLowerCase()))) {
        // Also update the name to reflect it's a tree/plant
        let updatedName = plant.name;
        
        if (plant.name.toLowerCase().includes('banana')) {
          updatedName = updatedName.endsWith(' Plant') ? updatedName : `${updatedName} Plant`;
        } else {
          updatedName = updatedName.endsWith(' Tree') ? updatedName : `${updatedName} Tree`;
        }
        
        return {
          ...plant,
          name: updatedName,
          category: 'tree'
        };
      }
      
      return {
        id: plant.id,
        name: plant.name,
        icon: plant.icon,
        category: plant.category,
        lifecycle: plant.lifecycle,
        parent_id: plant.parent_id
      };
    });
  } catch (error) {
    console.error("Error fetching plants:", error);
    toast.error("Failed to load plants");
    return [];
  }
};

// Create a new plant
export const createPlant = async (plantData: { name: string, icon: string, category: string, lifecycle?: string }): Promise<PlantItem | null> => {
  try {
    // Generate a client-side UUID for the plant
    const plantId = crypto.randomUUID();
    
    const newPlant = {
      id: plantId, // Explicitly set the ID using crypto.randomUUID()
      name: plantData.name,
      icon: plantData.icon,
      category: plantData.category,
      lifecycle: plantData.lifecycle || 'annual'
    };
    
    const { data, error } = await supabase
      .from('plants')
      .insert(newPlant)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    toast.success(`Created new plant: ${plantData.name}`);
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      category: data.category,
      lifecycle: data.lifecycle
    };
  } catch (error) {
    console.error("Error creating plant:", error);
    toast.error("Failed to create plant");
    return null;
  }
};

// Create a new plant variety
export const createPlantVariety = async (parentPlant: PlantItem, varietyName: string): Promise<PlantItem | null> => {
  try {
    // Generate a client-side UUID for the plant variety
    const varietyId = crypto.randomUUID();
    
    const newPlant = {
      id: varietyId, // Explicitly set the ID using crypto.randomUUID()
      name: varietyName,
      icon: parentPlant.icon,
      category: parentPlant.category,
      lifecycle: parentPlant.lifecycle,
      parent_id: parentPlant.id
    };
    
    const { data, error } = await supabase
      .from('plants')
      .insert(newPlant)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    toast.success(`Created new variety: ${varietyName}`);
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      category: data.category,
      lifecycle: data.lifecycle,
      parent_id: data.parent_id
    };
  } catch (error) {
    console.error("Error creating plant variety:", error);
    toast.error("Failed to create plant variety");
    return null;
  }
};

// Check if a plant has varieties (child plants)
export const hasVarieties = async (plantId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', plantId);
      
    if (error) {
      throw error;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error("Error checking if plant has varieties:", error);
    return false; // Default to false if we can't determine
  }
};

// Check if a plant is in use in any patch
export const isPlantInUse = async (plantId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('planted_items')
      .select('*', { count: 'exact', head: true })
      .eq('plant_id', plantId);
      
    if (error) {
      throw error;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error("Error checking if plant is in use:", error);
    return true; // Assume it's in use if we can't check, to prevent accidental deletion
  }
};

// Delete a plant
export const deletePlant = async (plantId: string): Promise<boolean> => {
  try {
    // Check if the plant is in use
    const inUse = await isPlantInUse(plantId);
    if (inUse) {
      toast.error("Cannot delete a plant that is in use in your garden");
      return false;
    }
    
    // For parent plants, we need to check if it has varieties
    const { data: varieties, error: varietiesError } = await supabase
      .from('plants')
      .select('id')
      .eq('parent_id', plantId);
      
    if (varietiesError) {
      throw varietiesError;
    }
    
    if (varieties && varieties.length > 0) {
      toast.error("Cannot delete a plant that has varieties");
      return false;
    }
    
    // Delete the plant
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', plantId);
      
    if (error) {
      throw error;
    }
    
    toast.success("Plant deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting plant:", error);
    toast.error("Failed to delete plant");
    return false;
  }
};
