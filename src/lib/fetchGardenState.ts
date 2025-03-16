import { supabase, ANONYMOUS_USER_ID, ANONYMOUS_USER_NAME } from "@/integrations/supabase/client";

export interface GardenState {
  patches: any[];
  plantedItems: Record<string, any[]>;
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

export const fetchGardenState = async ( updateAdvisor) => {
  try {
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
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('patch_tasks')
      .select('*');
      
    let plantedItems: Record<string, any[]> = {};
    if (!tasksError && tasksData) {
      tasksData.forEach(task => {
        if (!plantedItems[task.patch_id]) {
          plantedItems[task.patch_id] = [];
        }
        plantedItems[task.patch_id].push(task.task);
      });
    } else {
      const storedPlantedItems = localStorage.getItem('garden-planted-items');
      plantedItems = storedPlantedItems ? JSON.parse(storedPlantedItems) : {};
    }
    
    const weather = JSON.parse(localStorage.getItem('weather-data') || '{}');
    
    let location = "Unknown location";
    const savedSettings = localStorage.getItem("gardenSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.location) {
        location = settings.location;
      }
    }
    
    
    const lastTipTimestamp = localStorage.getItem('last-garden-tip-timestamp');
    const shouldShowTip = !lastTipTimestamp || 
      (Date.now() - parseInt(lastTipTimestamp, 10)) > 24 * 60 * 60 * 1000;
    const weatherSummary = summarizeWeather(weather);
    updateAdvisor( patches, plantedItems, weather, location, weatherSummary, shouldShowTip);
  } catch (error) {
    console.error("Error loading garden state:", error);
  }
};
