
import { supabase, ANONYMOUS_USER_ID, ANONYMOUS_USER_NAME } from "@/integrations/supabase/client";

export interface GardenState {
  patches: any[];
  plantedItems: Record<string, any[]>;
  plants: any[];
  weather?: any;
  location?: string;
}

const summarizeWeather = (weather: any): string => {
  if (!weather || !weather.data || !weather.data.length) {
    return "unknown weather conditions";
  }
  
  try {
    const tempData = weather.data.find((item: any) => item.parameter === "t_2m:C");
    const precipData = weather.data.find((item: any) => item.parameter === "precip_1h:mm");
    const windData = weather.data.find((item: any) => item.parameter === "wind_speed_10m:ms");
    
    let summary = "";
    
    if (tempData && tempData.coordinates[0].dates[0]) {
      const temp = tempData.coordinates[0].dates[0].value;
      summary += `${temp.toFixed(1)}°C`;
    }
    
    if (precipData && precipData.coordinates[0].dates[0]) {
      const precip = precipData.coordinates[0].dates[0].value;
      if (precip > 0) {
        summary += `, ${precip.toFixed(1)}mm precipitation`;
      } else {
        summary += ", no precipitation";
      }
    }
    
    if (windData && windData.coordinates[0].dates[0]) {
      const wind = windData.coordinates[0].dates[0].value;
      summary += `, wind ${wind.toFixed(1)}m/s`;
    }
    
    return summary;
  } catch (error) {
    console.error("Error summarizing weather:", error);
    return "unknown weather conditions";
  }
};

export const fetchGardenState = async (updateAdvisor) => {
  try {
    // Fetch patches
    const { data: patchesData, error: patchesError } = await supabase
      .from('patches')
      .select('*');
      
    let patches = [];
    if (!patchesError && patchesData) {
      patches = patchesData.map(patch => ({
        id: patch.id,
        name: patch.name,
        width: Number(patch.width),
        height: Number(patch.height),
        type: patch.type,
        heated: patch.heated,
        artificialLight: patch.artificial_light,
        naturalLightPercentage: patch.natural_light_percentage
      }));
    } else {
      const storedPatches = localStorage.getItem('garden-patches');
      patches = storedPatches ? JSON.parse(storedPatches) : [];
    }
    
    // Fetch planted items
    const { data: plantedItemsData, error: plantedItemsError } = await supabase
      .from('planted_items')
      .select(`
        id, 
        position_x, 
        position_y, 
        patch_id,
        plants (*)
      `);
      
    let plantedItems: Record<string, any[]> = {};
    if (!plantedItemsError && plantedItemsData) {
      plantedItemsData.forEach(item => {
        const patchId = item.patch_id;
        if (!plantedItems[patchId]) {
          plantedItems[patchId] = [];
        }
        
        const plant = item.plants;
        plantedItems[patchId].push({
          id: plant.id,
          name: plant.name,
          icon: plant.icon,
          category: plant.category,
          position: {
            x: item.position_x,
            y: item.position_y
          }
        });
      });
    } else {
      const storedPlantedItems = localStorage.getItem('garden-planted-items');
      plantedItems = storedPlantedItems ? JSON.parse(storedPlantedItems) : {};
    }
    
    // Fetch plants
    const { data: plantsData, error: plantsError } = await supabase
      .from('plants')
      .select('*');
      
    let plants = [];
    if (!plantsError && plantsData) {
      plants = plantsData.map(plant => ({
        id: plant.id,
        name: plant.name,
        icon: plant.icon,
        category: plant.category,
        parent_id: plant.parent_id
      }));
    }
    
    // Get weather data
    const weather = JSON.parse(localStorage.getItem('weather-data') || '{}');
    
    // Get location
    let location = "Unknown location";
    const savedSettings = localStorage.getItem("gardenSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.location) {
        location = settings.location;
      }
    }
    
    // Check if we should show a tip
    const lastTipTimestamp = localStorage.getItem('last-garden-tip-timestamp');
    const shouldShowTip = !lastTipTimestamp || 
      (Date.now() - parseInt(lastTipTimestamp, 10)) > 24 * 60 * 60 * 1000;
    const weatherSummary = summarizeWeather(weather);
    
    // Update the advisor with all the garden state
    updateAdvisor(
      patches,
      plantedItems,
      plants,
      weather, 
      location, 
      weatherSummary, 
      shouldShowTip
    );
  } catch (error) {
    console.error("Error loading garden state:", error);
  }
};
