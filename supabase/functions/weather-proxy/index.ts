
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
    
    // Expanded parameters to get more forecast data
    const url = `https://api.meteomatics.com/${now}--${endTime}:PT3H/t_2m:C,precip_1h:mm,wind_speed_10m:ms,weather_symbol_1h:idx/${lat},${lon}/json`;
    
    console.log("Proxying request to Meteomatics:", url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!response.ok) {
      console.error(`Meteomatics API responded with status: ${response.status}`);
      throw new Error(`Meteomatics API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Received Meteomatics data");
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error proxying to Meteomatics:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Failed to fetch weather data from Meteomatics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
