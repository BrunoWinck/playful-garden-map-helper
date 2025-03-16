
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request headers:", JSON.stringify(Object.fromEntries([...req.headers])));
    
    const bodyText = await req.text();
    console.log("Raw request body:", bodyText);
    
    let lat, lon, userId;
    try {
      const body = JSON.parse(bodyText);
      lat = body.lat;
      lon = body.lon;
      userId = body.userId || '00000000-0000-0000-0000-000000000000';
      console.log(`Parsed coordinates: lat=${lat}, lon=${lon}, userId=${userId}`);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error(`Failed to parse request body: ${parseError.message}`);
    }
    
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Using coordinates: lat=${lat}, lon=${lon}`);

    // Current time in ISO format
    const now = new Date().toISOString().split('.')[0] + 'Z';
    // For forecast data - get 7 days
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
    
    // Get credentials from Supabase secrets
    const username = Deno.env.get("METEOMATICS_USERNAME");
    const password = Deno.env.get("METEOMATICS_PASSWORD");
    
    if (!username || !password) {
      console.error("Missing Meteomatics credentials in environment variables");
      throw new Error("Meteomatics API credentials not configured");
    }
    
    // Create Basic Authentication header
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    
    // Exactly 10 parameters to comply with API limitations
    const params = [
      't_2m:C',                // temperature
      'precip_1h:mm',          // precipitation last hour
      'wind_speed_10m:ms',     // wind speed
      // 'wind_dir_10m:d',        // wind direction
      'weather_symbol_1h:idx', // weather symbol
      // 't_max_2m_24h:C',        // max temp in 24h
      // 't_min_2m_24h:C',        // min temp in 24h
      // 'msl_pressure:hPa',      // pressure
      'uv:idx',                // UV index
      // not in basic plan 'relative_humidity_2m:p' // humidity
    ].join(',');
    
    // Access the Meteomatics API
    const url = `https://api.meteomatics.com/${now}--${endTime}:PT3H/${params}/${lat},${lon}/json`;
    
    console.log("EXACT API URL BEING REQUESTED:", url);
    console.log("Authorization method: Basic Authentication with username:", username);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader
        }
      });
      
      console.log("Meteomatics API response status:", response.status);
      
      if (!response.ok) {
        const statusCode = response.status;
        console.error(`Meteomatics API responded with status: ${statusCode}`);
        
        let responseText = '';
        try {
          responseText = await response.text();
          console.error(`Response body: ${responseText}`);
        } catch (textError) {
          console.error("Could not read response text:", textError);
        }
        
        // If API error, fall back to climate data
        console.log("Falling back to climate data for average weather");
        return await getFallbackClimateData(lat, lon, userId);
      }
      
      const data = await response.json();
      
      // Add lat/lon to the response data for use in frontend calculations
      data.coordinates = { latitude: lat, longitude: lon };
      
      // Add timestamp for client-side "last updated" calculation
      data.timestamp = new Date().toISOString();
      
      console.log("Received Meteomatics data with parameters:", Object.keys(data.data).length);
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      console.error("Error fetching from Meteomatics API:", fetchError);
      // If fetch error, fall back to climate data
      console.log("Falling back to climate data for average weather due to fetch error");
      return await getFallbackClimateData(lat, lon, userId);
    }
  } catch (error) {
    console.error('Error fetching weather data from Meteomatics:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "An unknown error occurred",
      status: "ERROR",
      timestamp: new Date().toISOString(),
      details: {
        errorObject: String(error),
        stack: error.stack
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get fallback climate data (delegating to climate-data function)
async function getFallbackClimateData(lat: number, lon: number, userId: string) {
  console.log("Getting fallback climate data from climate-data function");
  
  // Create a Supabase client to call the climate-data function
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Call the climate-data function to get the data
    const { data: climateData, error } = await supabase.functions.invoke('climate-data', {
      body: { 
        lat, 
        lon, 
        userId 
      },
    });
    
    if (error) {
      console.error("Error calling climate-data function:", error);
      throw error;
    }
    
    if (!climateData) {
      throw new Error("No climate data returned from climate-data function");
    }
    
    // Add timestamp for client-side "last updated" calculation
    climateData.timestamp = new Date().toISOString();
    
    console.log("Successfully retrieved climate data");
    
    return new Response(JSON.stringify(climateData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error getting climate data:", error);
    
    // Return a minimal response with error information
    return new Response(JSON.stringify({
      status: "ERROR",
      error: "Failed to get climate data: " + error.message,
      timestamp: new Date().toISOString(),
      isClimateFallback: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
