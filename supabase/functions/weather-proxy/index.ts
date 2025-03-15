
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
    
    // Expanded parameters for more comprehensive weather data
    const params = [
      't_2m:C',                // temperature
      'precip_1h:mm',          // precipitation last hour
      'wind_speed_10m:ms',     // wind speed
      'wind_dir_10m:d',        // wind direction
      'wind_gusts_10m_1h:ms',  // wind gusts
      't_max_2m_24h:C',        // max temp in 24h
      't_min_2m_24h:C',        // min temp in 24h
      'msl_pressure:hPa',      // pressure
      'precip_24h:mm',         // precipitation last 24h
      'weather_symbol_1h:idx', // weather symbol
      'uv:idx',                // UV index
      'sunrise:sql',           // sunrise time
      'sunset:sql'             // sunset time
    ].join(',');
    
    // Access the Meteomatics API
    const url = `https://api.meteomatics.com/${now}--${endTime}:PT3H/${params}/${lat},${lon}/json`;
    
    console.log("Requesting weather data from Meteomatics:", url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!response.ok) {
      console.error(`Meteomatics API responded with status: ${response.status}`);
      const responseText = await response.text();
      console.error(`Response body: ${responseText}`);
      throw new Error(`Meteomatics API responded with status: ${response.status}`);
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
