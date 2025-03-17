
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export const storeMessage = async (message: Message, userId: string): Promise<boolean> => {
  try {
    console.log("Storing message:", message);
    
    const { error } = await supabase.from('advisor_chats').insert({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      user_id: userId
    });
    
    if (error) {
      console.error(`Error storing ${message.role} message:`, error);
      toast.error(`Failed to save the message due to: ${error.message}`, {
        duration: 30000,
        important: true,
      });
      
      if (error.code === '42501') {
        console.error("Row-level security policy violation. Check RLS policies for advisor_chats table.");
      }
      
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception when storing message:", err);
    toast.error("An error occurred while saving your message", {
      duration: 30000,
      important: true,
    });
    return false;
  }
};

export const fetchChatHistory = async (userId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('advisor_chats')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true 
  }).format(date);
};
