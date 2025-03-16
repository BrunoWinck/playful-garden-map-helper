
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log("NASA imagery function called");
    
    // Get the NASA API key from environment variables
    const NASA_API_KEY = Deno.env.get("NASA_API_KEY");
    
    if (!NASA_API_KEY) {
      throw new Error("NASA API key not configured in environment variables");
    }
    
    const { lat, lon, date, dim } = await req.json();
    
    // Validate parameters
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }
    
    console.log(`Request parameters: lat=${lat}, lon=${lon}, date=${date || 'today'}, dim=${dim || '0.025'}`);
    
    // Format date parameter (default to today if not provided)
    const formattedDate = date || new Date().toISOString().split('T')[0];
    
    // Set dimension (default to 0.025 degrees if not provided)
    const dimension = dim || 0.025;
    
    // Construct the NASA EPIC API URL
    const url = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${formattedDate}&dim=${dimension}&api_key=${NASA_API_KEY}`;
    
    console.log(`Calling NASA API: ${url.replace(NASA_API_KEY, '[REDACTED]')}`);
    
    // Add detailed request information to the response for debugging
    const requestDetails = {
      url: url.replace(NASA_API_KEY, '[REDACTED]'),
      parameters: {
        lat,
        lon,
        date: formattedDate,
        dim: dimension
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(url);
    console.log(`NASA API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NASA API error: ${errorText}`);
      
      return new Response(JSON.stringify({
        status: "ERROR",
        error: `NASA API responded with status: ${response.status}. ${errorText}`,
        request: requestDetails,
        timestamp: new Date().toISOString(),
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // We're either getting JSON or an image
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log("NASA API JSON response received:", data);
      
      return new Response(JSON.stringify({
        status: "SUCCESS",
        data,
        request: requestDetails,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (contentType?.includes('image')) {
      // For images, pass the URL through instead of the binary data
      console.log(`NASA API image received with content type: ${contentType}`);
      
      // Return the URL for the client to fetch directly
      return new Response(JSON.stringify({
        status: "SUCCESS",
        url: url,
        contentType,
        request: requestDetails,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`Unexpected content type: ${contentType}`);
      const responseText = await response.text();
      
      return new Response(JSON.stringify({
        status: "UNEXPECTED_RESPONSE",
        url: url.replace(NASA_API_KEY, '[REDACTED]'),
        contentType,
        responseText: responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''),
        request: requestDetails,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching NASA imagery:', error);
    
    return new Response(JSON.stringify({
      status: "ERROR",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
