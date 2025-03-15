
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
    console.log("Garden state summary:", JSON.stringify(gardenState).substring(0, 100) + "...");
    
    // Enhanced system prompt with special formatting instructions
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
- Sunlight needs for different plants and how the current daylight hours affect them
- Best practices for the current UV index level

IMPORTANT FORMATTING INSTRUCTIONS:
1. Surround any gardening or plant-related technical terms with double brackets, like this: [[term]]. For example: [[perennial]], [[deadheading]], [[composting]].
   - These terms will be automatically added to the user's gardening glossary.
   - Only use this for technical jargon or specialized gardening terms that a beginner might not know.
   - The double brackets will be used to detect terms and format them properly in the UI.
   - If the term contains multiple words, keep them within a single set of brackets: [[companion planting]]
   - IMPORTANT: Do not split terms across multiple lines. Keep each [[term]] on a single line.

2. Surround any actionable tasks or recommendations with double parentheses, like this: ((task)). For example: ((Water your tomatoes in the morning)), ((Apply mulch to retain moisture)).
   - These will be automatically added to the user's task list.
   - Use this format for specific, actionable recommendations that the user should consider doing.
   - The double parentheses will be used to detect tasks and format them properly in the UI.
   - If the task contains multiple lines, keep them within a single set of parentheses: ((Task step 1, then step 2))
   - IMPORTANT: Do not split tasks across multiple lines. Keep each ((task)) on a single line.

If weather data is missing or incomplete, focus on general gardening advice based on the plant types and season.

Keep your responses concise and to the point. Focus on providing actionable advice that considers the available data provided.

Keep your responses focused on gardening topics. If the user asks about non-gardening topics, politely redirect them to gardening-related questions.`;

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

    console.log("Sending request to Mistral API...");
    
    // Make request to Mistral AI API with timeout and retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
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
          max_tokens: 800,
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
      
      // Process response to ensure proper formatting
      let processedContent = data.choices[0].message.content;
      
      // Fix potential line breaks within markup
      processedContent = processedContent
        // Fix glossary terms that might be split across lines
        .replace(/\[\[([^\]]*?)\n([^\]]*?)\]\]/g, "[[$1 $2]]")
        // Fix tasks that might be split across lines
        .replace(/\(\(([^)]*?)\n([^)]*?)\)\)/g, "(($1 $2))");
      
      return new Response(JSON.stringify({
        response: processedContent,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError.message);
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          success: false,
          error: "Request to Mistral API timed out after 30 seconds."
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
    console.error("Error in garden-advisor function:", error);
    
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
