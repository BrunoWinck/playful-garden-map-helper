
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();
    
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Using coordinates: lat=${lat}, lon=${lon}`);

    // Current time in ISO format
    const now = new Date().toISOString().split('.')[0] + 'Z';
    // For forecast data - get 7 days
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
    
    // Create Basic Authentication header
    const username = "na_winck_bruno";
    const password = "3Ijssv14QC";
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    
    // Reduced parameters to 10 maximum to comply with API limitations
    // We're selecting the most essential weather parameters
    const params = [
      't_2m:C',                // temperature
      'precip_1h:mm',          // precipitation last hour
      'wind_speed_10m:ms',     // wind speed
      'wind_dir_10m:d',        // wind direction
      'weather_symbol_1h:idx', // weather symbol
      't_max_2m_24h:C',        // max temp in 24h
      't_min_2m_24h:C',        // min temp in 24h
      'msl_pressure:hPa',      // pressure
      'uv:idx',                // UV index
      'sunrise:sql'            // sunrise time
      // Removed sunset:sql to stay within 10-parameter limit
    ].join(',');
    
    // Access the Meteomatics API
    const url = `https://api.meteomatics.com/${now}--${endTime}:PT3H/${params}/${lat},${lon}/json`;
    
    console.log("EXACT API URL BEING REQUESTED:", url);
    console.log("Authorization method: Basic Authentication with username:", username);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    });
    
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
      
      throw new Error(`Meteomatics API responded with status: ${statusCode}. Details: ${responseText}`);
    }
    
    const data = await response.json();
    console.log("Received Meteomatics data with parameters:", Object.keys(data.data).length);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching weather data from Meteomatics:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "An unknown error occurred",
      status: "ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
