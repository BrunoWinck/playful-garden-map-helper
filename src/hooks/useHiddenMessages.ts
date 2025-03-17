
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/contexts/ProfileContext";

export const useHiddenMessages = () => {
  const { currentUser } = useProfile();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
  const [hiddenMessages, setHiddenMessages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHiddenMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('hidden_messages')
          .select('message_id')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const hiddenMessageIds = new Set(data.map(item => item.message_id));
          setHiddenMessages(hiddenMessageIds);
          console.log("Loaded hidden messages:", hiddenMessageIds.size);
        }
      } catch (error) {
        console.error("Error fetching hidden messages:", error);
        toast.error("Couldn't load your message preferences.", {
          duration: 10000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchHiddenMessages();
    }
  }, [userId, currentUser]);

  const toggleMessageVisibility = async (messageId: string) => {
    try {
      const isCurrentlyHidden = hiddenMessages.has(messageId);
      
      // Optimistically update UI
      setHiddenMessages(prevHiddenMessages => {
        const newHiddenMessages = new Set(prevHiddenMessages);
        if (isCurrentlyHidden) {
          newHiddenMessages.delete(messageId);
        } else {
          newHiddenMessages.add(messageId);
        }
        return newHiddenMessages;
      });
      
      // Update database
      if (isCurrentlyHidden) {
        // Remove from hidden messages
        const { error } = await supabase
          .from('hidden_messages')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        console.log("Message unhidden in database:", messageId);
      } else {
        // Add to hidden messages
        const { error } = await supabase
          .from('hidden_messages')
          .insert({
            id: crypto.randomUUID(),
            message_id: messageId,
            user_id: userId
          });
          
        if (error) {
          throw error;
        }
        
        console.log("Message hidden in database:", messageId);
      }
    } catch (error) {
      console.error("Error toggling message visibility:", error);
      
      // Revert UI change if there was an error
      setHiddenMessages(prevHiddenMessages => {
        const newHiddenMessages = new Set(prevHiddenMessages);
        if (hiddenMessages.has(messageId)) {
          newHiddenMessages.add(messageId);
        } else {
          newHiddenMessages.delete(messageId);
        }
        return newHiddenMessages;
      });
      
      toast.error("Failed to update message visibility", {
        duration: 5000,
      });
    }
  };

  const isMessageHidden = (messageId: string) => {
    return hiddenMessages.has(messageId);
  };

  return {
    hiddenMessages,
    isLoading,
    toggleMessageVisibility,
    isMessageHidden
  };
};
