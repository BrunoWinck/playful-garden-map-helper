
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // SQL for creating the hidden_messages table
    const migrationSQL = `
      -- Create hidden_messages table to store which messages users have chosen to hide
      CREATE TABLE IF NOT EXISTS public.hidden_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        
        -- Add constraints
        CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES public.advisor_chats(id) ON DELETE CASCADE,
        CONSTRAINT unique_hidden_message_per_user UNIQUE (message_id, user_id)
      );

      -- Add RLS policies
      ALTER TABLE public.hidden_messages ENABLE ROW LEVEL SECURITY;

      -- Users can only see their own hidden message preferences
      CREATE POLICY "Users can view their own hidden messages" 
        ON public.hidden_messages 
        FOR SELECT 
        USING (user_id = '00000000-0000-0000-0000-000000000000');

      -- Users can insert their own hidden message preferences
      CREATE POLICY "Users can add their own hidden messages" 
        ON public.hidden_messages 
        FOR INSERT 
        WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

      -- Users can delete their own hidden message preferences
      CREATE POLICY "Users can delete their own hidden messages" 
        ON public.hidden_messages 
        FOR DELETE 
        USING (user_id = '00000000-0000-0000-0000-000000000000');
    `;

    // Execute the migration
    const { error } = await supabaseAdmin.rpc('pgclient', { query: migrationSQL });

    if (error) {
      console.error("Error running migration:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Hidden messages table created successfully" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
