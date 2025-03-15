
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
    const { message, gardenState } = await req.json();
    console.log("Received message:", message);
    console.log("Garden state:", JSON.stringify(gardenState).substring(0, 200) + "...");
    
    // Enhanced system prompt with more detailed weather context
    const systemPrompt = `You are a knowledgeable garden advisor specialized in gardening, plants, and sustainable practices.
    
Current Garden State:
${JSON.stringify(gardenState, null, 2)}

Provide helpful, practical advice about gardening based on the user's question and the current garden state.
Consider:
- Current weather conditions and forecast (temperature, precipitation, wind, UV index)
- Plant types in the garden and their growth stages
- Seasonal factors including sunrise/sunset times
- Sustainable practices

Use the detailed weather data to provide specific recommendations, such as:
- When to water based on precipitation forecasts
- How to protect plants based on temperature, wind, and UV predictions
- Optimal times for garden activities based on conditions

Keep your responses concise and to the point. Focus on providing actionable advice that considers the current weather and location data provided.

Keep your responses focused on gardening topics. If the user asks about non-gardening topics, politely redirect them to gardening-related questions.`;

    // Make request to Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 800, // Reduced for more concise responses
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mistral API error:", errorData);
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Mistral API response received");
    
    return new Response(JSON.stringify({
      response: data.choices[0].message.content,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in garden-advisor function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
