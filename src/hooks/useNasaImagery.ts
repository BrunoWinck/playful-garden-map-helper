
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NasaImageryParams {
  lat: number;
  lon: number;
  date?: string; // Optional: YYYY-MM-DD format
  dim?: number;  // Optional: dimension in degrees (0.025 to 0.1)
}

interface NasaApiResponse {
  status: string;
  url?: string;
  error?: string;
  data?: any;
  request?: {
    url: string;
    parameters: {
      lat: number;
      lon: number;
      date: string;
      dim: number;
    };
    timestamp: string;
  };
  contentType?: string;
  responseText?: string;
  timestamp?: string;
}

export const useNasaImagery = ({ lat, lon, date, dim }: NasaImageryParams) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  useEffect(() => {
    const fetchSatelliteImage = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      try {
        console.log(`[NASA Imagery] Fetching satellite image for lat=${lat}, lon=${lon}, date=${date || 'today'}, dim=${dim || '0.025'}`);
        
        // Call the Supabase Edge Function
        const startTime = performance.now();
        const { data, error: functionError } = await supabase.functions.invoke<NasaApiResponse>('nasa-imagery', {
          body: { lat, lon, date, dim }
        });
        const endTime = performance.now();
        
        console.log(`[NASA Imagery] Edge function response time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log('[NASA Imagery] Raw response data:', data);
        
        if (functionError) {
          console.error("[NASA Imagery] Edge function error:", functionError);
          setDebugInfo({
            type: 'edge_function_error',
            error: functionError,
            request: { lat, lon, date, dim }
          });
          throw new Error(`NASA API error: ${functionError.message}`);
        }
        
        if (!data) {
          console.error("[NASA Imagery] Empty response received");
          setDebugInfo({
            type: 'empty_response',
            request: { lat, lon, date, dim }
          });
          throw new Error("NASA API returned empty response");
        }
        
        // Store all response data for debugging
        setDebugInfo({
          type: 'api_response',
          data,
          request: { lat, lon, date, dim },
          timestamp: new Date().toISOString()
        });
        
        if (data.status === 'ERROR') {
          console.error("[NASA Imagery] API error:", data.error);
          throw new Error(data.error || 'Unknown error fetching NASA imagery');
        }
        
        if (data.status === 'UNEXPECTED_RESPONSE') {
          console.warn("[NASA Imagery] Unexpected response type:", data.contentType);
          console.log("[NASA Imagery] Response preview:", data.responseText);
          throw new Error(`Unexpected response type: ${data.contentType}`);
        }
        
        // If we have a direct URL
        if (data.url) {
          console.log("[NASA Imagery] Setting image URL:", data.url.replace(/(api_key=)[^&]+/, '$1[REDACTED]'));
          setImageUrl(data.url);
        } 
        // If we have JSON data with a URL field
        else if (data.data && data.data.url) {
          console.log("[NASA Imagery] Setting image URL from data:", data.data.url);
          setImageUrl(data.data.url);
        } 
        else {
          console.error("[NASA Imagery] No URL found in response:", data);
          throw new Error("Failed to get satellite image URL");
        }
      } catch (apiError) {
        console.error('[NASA Imagery] Error fetching satellite imagery:', apiError);
        setError(`Failed to fetch satellite image: ${apiError.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (lat && lon) {
      fetchSatelliteImage();
    } else {
      console.log("[NASA Imagery] Missing coordinates, not fetching");
      setLoading(false);
    }
  }, [lat, lon, date, dim]);

  return { imageUrl, loading, error, debugInfo };
};
