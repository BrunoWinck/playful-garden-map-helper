
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { location, userId } = await req.json();
    console.log(`Processing climate data request for location: ${location}, userId: ${userId}`);

    // Create a Supabase client with the Admin key (to bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current month
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
    
    // Check if we need to update the climate data
    const { data: existingData, error: fetchError } = await supabase
      .from('climate_averages')
      .select('*')
      .eq('user_id', userId)
      .eq('location', location)
      .eq('month', currentMonth)
      .single();
    
    // If we have data that's less than 3 months old, return it
    if (existingData && !fetchError) {
      const lastUpdated = new Date(existingData.last_updated);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (lastUpdated > threeMonthsAgo) {
        console.log("Using existing climate data (less than 3 months old)");
        return new Response(JSON.stringify({
          data: existingData,
          updated: false,
          message: "Using existing climate data"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // We need to fetch new climate data
    console.log("Fetching new climate data");
    
    // Parse location string to get coordinates
    const [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Invalid location format. Expected 'latitude,longitude'");
    }
    
    // Get average climate data for the current month based on historical data
    // This would typically use a climate data API, but for now we'll use mock data
    // that's roughly accurate for different regions and months
    const avgData = generateAverageClimateData(lat, lon, currentMonth);
    
    // Upsert the data into the database
    const { data: updatedData, error: updateError } = await supabase
      .from('climate_averages')
      .upsert({
        user_id: userId,
        location: location,
        month: currentMonth,
        avg_temperature: avgData.temperature,
        avg_precipitation: avgData.precipitation,
        avg_uv_index: avgData.uvIndex,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,location,month'
      })
      .select()
      .single();
    
    if (updateError) {
      console.error("Error upserting climate data:", updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    console.log("Climate data updated successfully");
    return new Response(JSON.stringify({
      data: updatedData,
      updated: true,
      message: "Climate data updated successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error processing climate data request:", error);
    return new Response(JSON.stringify({
      error: error.message || "An unknown error occurred",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to generate average climate data based on location and month
function generateAverageClimateData(latitude: number, longitude: number, month: number) {
  // Simplified model that generates realistic climate data based on latitude and month
  // This is a very basic approximation - a real implementation would use proper climate APIs or datasets
  
  // Determine hemisphere (affects seasons)
  const isNorthernHemisphere = latitude > 0;
  
  // Adjust month for Southern Hemisphere (opposite seasons)
  const adjustedMonth = isNorthernHemisphere ? month : ((month + 6 - 1) % 12) + 1;
  
  // Base temperature varies by latitude (colder at poles, warmer at equator)
  const baseTemp = 30 - Math.abs(latitude) * 0.5;
  
  // Temperature variation by month (seasonal effects)
  // In Northern Hemisphere: warmest in July (month 7), coldest in January (month 1)
  const monthFactor = Math.cos((adjustedMonth - 7) * Math.PI / 6) * (Math.abs(latitude) / 23.5);
  const temperature = baseTemp + monthFactor * 15;
  
  // Precipitation varies by latitude and month
  // More rain near equator and during "wet seasons"
  const basePrecip = 100 - Math.abs(latitude - 20) * 1.5;
  const seasonalPrecip = Math.sin((adjustedMonth) * Math.PI / 6) * 50;
  const precipitation = Math.max(10, basePrecip + seasonalPrecip);
  
  // UV index varies by latitude and season
  // Highest at equator and during summer
  const baseUV = 12 - Math.abs(latitude) * 0.1;
  const seasonalUV = Math.cos((adjustedMonth - 7) * Math.PI / 6) * (Math.abs(latitude) / 23.5) * 5;
  const uvIndex = Math.max(1, Math.min(12, baseUV + seasonalUV));
  
  return {
    temperature: Math.round(temperature * 10) / 10,
    precipitation: Math.round(precipitation * 10) / 10,
    uvIndex: Math.round(uvIndex * 10) / 10
  };
}
