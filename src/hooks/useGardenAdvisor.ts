
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GardenState, fetchGardenState } from "@/lib/fetchGardenState";
import { Message, storeMessage, fetchChatHistory } from "@/lib/chatUtils";
import { useProfile } from "@/contexts/ProfileContext";

export const useGardenAdvisor = () => {
  const { currentUser } = useProfile();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gardenState, setGardenState] = useState<GardenState>({
    patches: [],
    plantedItems: {},
    plants: []
  });
  const [dailyTipShown, setDailyTipShown] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const chatHistory = await fetchChatHistory(userId);
        
        if (chatHistory.length > 0) {
          setMessages(chatHistory);
          console.log("Loaded chat history:", chatHistory.length, "messages");
        } else {
          const welcomeMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Hello! I'm your garden advisor. I can help with plant care, pest management, garden planning, and more. How can I assist you today?",
            timestamp: new Date()
          };
          
          setMessages([welcomeMessage]);
          
          await storeMessage(welcomeMessage, userId);
          
          console.log("No chat history found, created welcome message");
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Couldn't load your chat history. Please try again later.", {
          duration: 30000,
          important: true,
        });
        setMessages([{
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hello! I'm your garden advisor. I can help with plant care, pest management, garden planning, and more. How can I assist you today?",
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    if (currentUser) {
      loadChatHistory();
    }
  }, [userId, currentUser]);

  // Fetch garden state
  useEffect(() => {
    function updateAdvisor(patches: any[], plantedItems: any, plants: any[], weather: any, location: any, weatherSummary: any, shouldShowTip: boolean) {
      setGardenState({
        patches,
        plantedItems,
        plants,
        weather,
        location
      });
      if (!initialized) {
        if (!isLoadingHistory && currentUser) {
          initializeAdvisor(patches, plantedItems, weather, weatherSummary, location);
          setInitialized(true);
          
          if (shouldShowTip && !dailyTipShown) {
            getDailyTip();
          }
        }
      }
    }
    
    fetchGardenState(updateAdvisor, userId, currentUser?.name);
  }, [initialized, dailyTipShown, isLoadingHistory, userId, currentUser]);

  const initializeAdvisor = async (patches: any[], plantedItems: Record<string, any[]>, weather: any, weatherSummary: any, location: string) => {
    if (weather && weather.data && location) {
      try {
        const contextMessage = `I'm analyzing your garden at ${location} with current weather: ${weatherSummary}`;
        
        const { data, error } = await supabase.functions.invoke('garden-advisor', {
          body: { 
            message: "Please acknowledge this context information silently without responding directly to me. Just use it to inform your future advice.",
            gardenState: {
              patches,
              plantedItems,
              weather,
              location
            }
          }
        });
        
        if (error) {
          console.error("Error initializing context:", error);
        } else {
          console.log("Successfully initialized garden advisor with context");
        }
      } catch (error) {
        console.error("Error sending context to advisor:", error);
      }
    }
  };

  const getDailyTip = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('garden-advisor', {
        body: { 
          message: "Give me a brief daily tip for my garden based on the current state and weather.",
          gardenState 
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        const tipMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, tipMessage]);
        
        await storeMessage(tipMessage, userId);
        
        localStorage.setItem('last-garden-tip-timestamp', Date.now().toString());
        setDailyTipShown(true);
      }
    } catch (error) {
      console.error("Error getting daily tip:", error);
      toast.error("Couldn't get your daily gardening tip. Please try again later.", {
        duration: 30000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const userMessageStored = await storeMessage(userMessage, userId);
      
      if (!userMessageStored) {
        toast("Continuing without saving your message", {
          duration: 30000,
        });
      }
      
      const { data, error } = await supabase.functions.invoke('garden-advisor', {
        body: { 
          message: input,
          gardenState 
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        const assistantMessageStored = await storeMessage(assistantMessage, userId);
        
        if (!assistantMessageStored) {
          toast("The AI response won't be saved to your history", {
            duration: 30000,
          });
        }
      } else {
        throw new Error("Received invalid response from garden advisor");
      }
    } catch (error) {
      console.error("Error querying garden advisor:", error);
      toast.error("Couldn't connect to the garden advisor. Please try again later.", {
        duration: 30000,
        important: true,
      });
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "system",
        content: "Sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      await storeMessage(errorMessage, userId);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    isInputFocused,
    setIsInputFocused,
    handleSubmit
  };
};
