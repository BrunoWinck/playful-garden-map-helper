
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
    
    // Create Basic Authentication header
    const username = "na_winck_bruno";
    const password = "3Ijssv14QC";
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    
    // Exactly 10 parameters to comply with API limitations
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
      'relative_humidity_2m:p' // humidity
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

// Helper function to get fallback climate data
async function getFallbackClimateData(lat: number, lon: number, userId: string) {
  console.log("Getting fallback climate data");
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the current month
    const currentMonth = new Date().getMonth() + 1;
    const location = `${lat}, ${lon}`;
    
    // Try to get climate data from the database
    const { data: climateData, error: dbError } = await supabase
      .from('climate_averages')
      .select('*')
      .eq('user_id', userId)
      .eq('location', location)
      .eq('month', currentMonth)
      .single();
    
    let averageData;
    
    if (dbError || !climateData) {
      console.log("No climate data found in database, generating new data");
      // Generate climate data on the fly
      averageData = {
        avg_temperature: generateTemperature(lat, currentMonth),
        avg_precipitation: generatePrecipitation(lat, currentMonth),
        avg_uv_index: generateUVIndex(lat, currentMonth)
      };
      
      // Store this data for future use
      await supabase
        .from('climate_averages')
        .upsert({
          user_id: userId,
          location: location,
          month: currentMonth,
          avg_temperature: averageData.avg_temperature,
          avg_precipitation: averageData.avg_precipitation,
          avg_uv_index: averageData.avg_uv_index,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,location,month'
        });
    } else {
      console.log("Using climate data from database:", climateData);
      averageData = {
        avg_temperature: climateData.avg_temperature,
        avg_precipitation: climateData.avg_precipitation,
        avg_uv_index: climateData.avg_uv_index
      };
    }
    
    // Create a response in a format similar to what the weather API would return
    const mockWeatherData = {
      data: {
        "t_2m:C": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: averageData.avg_temperature,
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
        "precip_1h:mm": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: averageData.avg_precipitation / 30 / 24, // Daily average divided by 24 hours
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
        "uv:idx": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: averageData.avg_uv_index,
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
        "relative_humidity_2m:p": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: 70, // Default humidity value
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
        "weather_symbol_1h:idx": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: 1, // Default clear weather
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
        "wind_speed_10m:ms": {
          coordinates: [{
            dates: Array(24).fill(0).map((_, i) => ({
              value: 2, // Default light breeze
              date: new Date(Date.now() + i * 3600 * 1000).toISOString()
            }))
          }]
        },
      },
      coordinates: { latitude: lat, longitude: lon },
      isClimateFallback: true
    };
    
    return new Response(JSON.stringify(mockWeatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating fallback climate data:", error);
    
    // Return a minimal response with generated data
    const defaultData = {
      data: {
        "t_2m:C": {
          coordinates: [{
            dates: [{ value: 15, date: new Date().toISOString() }]
          }]
        },
        "precip_1h:mm": {
          coordinates: [{
            dates: [{ value: 0, date: new Date().toISOString() }]
          }]
        },
      },
      coordinates: { latitude: lat, longitude: lon },
      isClimateFallback: true,
      warning: "Using emergency fallback data"
    };
    
    return new Response(JSON.stringify(defaultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Helper functions to generate climate data based on latitude and month
function generateTemperature(latitude: number, month: number): number {
  const isNorthernHemisphere = latitude > 0;
  const adjustedMonth = isNorthernHemisphere ? month : ((month + 6 - 1) % 12) + 1;
  
  const baseTemp = 30 - Math.abs(latitude) * 0.5;
  const monthFactor = Math.cos((adjustedMonth - 7) * Math.PI / 6) * (Math.abs(latitude) / 23.5);
  const temperature = baseTemp + monthFactor * 15;
  
  return Math.round(temperature * 10) / 10;
}

function generatePrecipitation(latitude: number, month: number): number {
  const isNorthernHemisphere = latitude > 0;
  const adjustedMonth = isNorthernHemisphere ? month : ((month + 6 - 1) % 12) + 1;
  
  const basePrecip = 100 - Math.abs(latitude - 20) * 1.5;
  const seasonalPrecip = Math.sin((adjustedMonth) * Math.PI / 6) * 50;
  const precipitation = Math.max(10, basePrecip + seasonalPrecip);
  
  return Math.round(precipitation * 10) / 10;
}

function generateUVIndex(latitude: number, month: number): number {
  const isNorthernHemisphere = latitude > 0;
  const adjustedMonth = isNorthernHemisphere ? month : ((month + 6 - 1) % 12) + 1;
  
  const baseUV = 12 - Math.abs(latitude) * 0.1;
  const seasonalUV = Math.cos((adjustedMonth - 7) * Math.PI / 6) * (Math.abs(latitude) / 23.5) * 5;
  const uvIndex = Math.max(1, Math.min(12, baseUV + seasonalUV));
  
  return Math.round(uvIndex * 10) / 10;
}
