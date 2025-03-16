
-- Add RPC functions for hidden messages to avoid TypeScript errors with direct table access

-- Function to get hidden messages for a user
CREATE OR REPLACE FUNCTION public.get_hidden_messages(user_id_param UUID)
RETURNS TABLE(message_id UUID) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT hm.message_id
  FROM public.hidden_messages hm
  WHERE hm.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to hide a message
CREATE OR REPLACE FUNCTION public.hide_message(
  id_param UUID,
  message_id_param UUID, 
  user_id_param UUID
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.hidden_messages(id, message_id, user_id)
  VALUES (id_param, message_id_param, user_id_param)
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to unhide a message
CREATE OR REPLACE FUNCTION public.unhide_message(
  message_id_param UUID, 
  user_id_param UUID
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.hidden_messages
  WHERE message_id = message_id_param AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the RPC functions
GRANT EXECUTE ON FUNCTION public.get_hidden_messages TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hide_message TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unhide_message TO anon, authenticated;
