
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ANONYMOUS_USER_ID } from "@/integrations/supabase/client";

export interface ClimateAverage {
  id: string;
  user_id: string;
  location: string;
  month: number;
  avg_temperature: number;
  avg_precipitation: number;
  avg_uv_index: number;
  last_updated: string;
}

export const useClimateData = () => {
  const [climateData, setClimateData] = useState<ClimateAverage[] | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<ClimateAverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClimateData = async (forceUpdate = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching climate data...");
      
      // Get location from settings
      const settingsData = localStorage.getItem("gardenSettings");
      let location = "45.882550, 2.905965"; // Default coordinates if settings not found
      
      if (settingsData) {
        try {
          const settings = JSON.parse(settingsData);
          if (settings.location) {
            location = settings.location;
          }
        } catch (parseError) {
          console.error('Error parsing settings:', parseError);
        }
      }
      
      const userId = ANONYMOUS_USER_ID;
      
      // Call the edge function to get or update climate data
      const { data: functionData, error: functionError } = await supabase.functions.invoke('climate-data', {
        body: { 
          location,
          userId,
          forceUpdate
        }
      });
      
      if (functionError) {
        throw new Error(`Climate data API error: ${functionError.message}`);
      }
      
      if (!functionData) {
        throw new Error("Climate data API returned empty response");
      }
      
      if (functionData.error) {
        throw new Error(functionData.error);
      }
      
      // Get the current month data returned by the function
      setCurrentMonthData(functionData.data);
      
      // Now fetch all climate data for this location
      const { data: allClimateData, error: fetchError } = await supabase
        .from('climate_averages')
        .select('*')
        .eq('user_id', userId)
        .eq('location', location);
        
      if (fetchError) {
        throw new Error(`Error fetching all climate data: ${fetchError.message}`);
      }
      
      setClimateData(allClimateData || []);
      console.log("Climate data loaded successfully", allClimateData);
      
    } catch (apiError: any) {
      console.error('Error fetching climate data:', apiError);
      setError(`Failed to fetch climate data: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClimateData();
    
    // Set up a timer to check for updates every 3 months
    const checkInterval = 7 * 24 * 60 * 60 * 1000; // Check weekly, but only update if >3 months old
    const intervalId = setInterval(() => {
      fetchClimateData();
    }, checkInterval);
    
    return () => clearInterval(intervalId);
  }, []);

  return { 
    climateData, 
    currentMonthData, 
    loading, 
    error, 
    refreshClimateData: (forceUpdate = false) => fetchClimateData(forceUpdate) 
  };
};
