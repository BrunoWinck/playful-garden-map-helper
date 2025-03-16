
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
