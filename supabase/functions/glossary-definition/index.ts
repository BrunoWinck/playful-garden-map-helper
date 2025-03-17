
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { term } = await req.json();
    console.log("Generating definition for term:", term);
    
    // Check if Mistral API key is available
    if (!mistralApiKey) {
      console.error("Mistral API key is not set");
      return new Response(JSON.stringify({
        success: false,
        error: "API configuration error. Please check your environment variables."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Sending request to Mistral API for glossary definition...");
    
    // Make request to Mistral AI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralApiKey}`
        },
        body: JSON.stringify({
          model: "mistral-small",
          messages: [
            { 
              role: "system", 
              content: "You are a gardening expert. Provide accurate, concise definitions for gardening terms. Keep your response under 100 words and focused only on the definition."
            },
            { 
              role: "user", 
              content: `Please provide a concise definition (1-2 sentences) for the gardening term: "${term}"`
            }
          ],
          temperature: 0.5,
          max_tokens: 150,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log("Mistral API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Mistral API error status:", response.status);
        console.error("Mistral API error details:", errorText);
        
        throw new Error(`Mistral API error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log("Mistral API response received successfully");
      
      const definition = data.choices[0].message.content.trim();
      
      return new Response(JSON.stringify({
        success: true,
        definition: definition
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError.message);
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          success: false,
          error: "Request to Mistral API timed out after 10 seconds."
        }), {
          status: 504, // Gateway Timeout
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw fetchError; // Re-throw to be caught by outer try-catch
      }
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    console.error("Error in glossary-definition function:", error);
    
    // Provide detailed error information in the response
    let errorMessage = error.message || "An unknown error occurred";
    let statusCode = 500;
    
    if (errorMessage.includes("Failed to fetch") || 
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("network") ||
        errorMessage.includes("502") ||
        errorMessage.includes("Bad Gateway")) {
      errorMessage = "Connection to Mistral AI failed. The service might be temporarily unavailable.";
      statusCode = 502; // Bad Gateway
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
