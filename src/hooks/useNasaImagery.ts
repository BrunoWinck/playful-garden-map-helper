
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NasaImageryParams {
  lat: number;
  lon: number;
  date?: string; // Optional: YYYY-MM-DD format
  dim?: number;  // Optional: dimension in degrees (0.025 to 0.1)
}

export const useNasaImagery = ({ lat, lon, date, dim }: NasaImageryParams) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSatelliteImage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching NASA satellite image for lat=${lat}, lon=${lon}`);
        
        // Call the Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('nasa-imagery', {
          body: { lat, lon, date, dim }
        });
        
        if (functionError) {
          console.error("Edge function error:", functionError);
          throw new Error(`NASA API error: ${functionError.message}`);
        }
        
        if (!data) {
          throw new Error("NASA API returned empty response");
        }
        
        if (data.status === 'ERROR') {
          console.error("NASA API error:", data.error);
          throw new Error(data.error || 'Unknown error fetching NASA imagery');
        }
        
        // Create a blob URL from the image data
        if (data.url) {
          console.log("Setting NASA image URL:", data.url);
          setImageUrl(data.url);
        } else {
          // If we're receiving an error or no URL
          console.error("Unexpected NASA API response:", data);
          throw new Error("Failed to get satellite image URL");
        }
      } catch (apiError) {
        console.error('Error fetching NASA satellite imagery:', apiError);
        setError(`Failed to fetch satellite image: ${apiError.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (lat && lon) {
      fetchSatelliteImage();
    }
  }, [lat, lon, date, dim]);

  return { imageUrl, loading, error };
};
