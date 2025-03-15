import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Lightbulb, SendHorizonal, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GardenState {
  patches: any[];
  plantedItems: Record<string, any[]>;
  weather?: any;
  location?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export const GardenAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gardenState, setGardenState] = useState<GardenState>({
    patches: [],
    plantedItems: {}
  });
  const [dailyTipShown, setDailyTipShown] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat history from Supabase on load
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('advisor_chats')
          .select('*')
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Format the messages from DB
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
        } else {
          // If no history, add a welcome message
          const welcomeMessage: Message = {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your garden advisor. I can help with plant care, pest management, garden planning, and more. How can I assist you today?",
            timestamp: new Date()
          };
          
          setMessages([welcomeMessage]);
          
          // Store welcome message in DB
          await supabase.from('advisor_chats').insert({
            role: welcomeMessage.role,
            content: welcomeMessage.content,
            timestamp: welcomeMessage.timestamp.toISOString()
          });
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
        // Fallback to welcome message
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm your garden advisor. I can help with plant care, pest management, garden planning, and more. How can I assist you today?",
          timestamp: new Date()
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchChatHistory();
  }, []);
  
  // Get garden state from Supabase and localStorage
  useEffect(() => {
    const fetchGardenState = async () => {
      try {
        // First try to get patches from Supabase
        const { data: patchesData, error: patchesError } = await supabase
          .from('patches')
          .select('*');
          
        let patches = [];
        if (!patchesError && patchesData) {
          patches = patchesData.map(patch => ({
            id: patch.id,
            name: patch.name,
            width: Number(patch.width),
            height: Number(patch.height),
            type: patch.type,
            heated: patch.heated,
            artificialLight: patch.artificial_light,
            naturalLightPercentage: patch.natural_light_percentage
          }));
        } else {
          // Fallback to localStorage if DB fetch fails
          const storedPatches = localStorage.getItem('garden-patches');
          patches = storedPatches ? JSON.parse(storedPatches) : [];
        }
        
        // Get patch tasks from Supabase
        const { data: tasksData, error: tasksError } = await supabase
          .from('patch_tasks')
          .select('*');
          
        let plantedItems: Record<string, any[]> = {};
        if (!tasksError && tasksData) {
          // Group tasks by patch_id
          tasksData.forEach(task => {
            if (!plantedItems[task.patch_id]) {
              plantedItems[task.patch_id] = [];
            }
            plantedItems[task.patch_id].push(task.task);
          });
        } else {
          // Fallback to localStorage
          const storedPlantedItems = localStorage.getItem('garden-planted-items');
          plantedItems = storedPlantedItems ? JSON.parse(storedPlantedItems) : {};
        }
        
        const weather = JSON.parse(localStorage.getItem('weather-data') || '{}');
        
        // Get location from settings
        let location = "Unknown location";
        const savedSettings = localStorage.getItem("gardenSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.location) {
            location = settings.location;
          }
        }
        
        setGardenState({
          patches,
          plantedItems,
          weather,
          location
        });
        
        // Check if we should show a daily tip
        const lastTipTimestamp = localStorage.getItem('last-garden-tip-timestamp');
        const shouldShowTip = !lastTipTimestamp || 
          (Date.now() - parseInt(lastTipTimestamp, 10)) > 24 * 60 * 60 * 1000;
        
        if (!initialized) {
          // Initialize the advisor with contextual information
          if (!isLoadingHistory) {
            initializeAdvisor(patches, plantedItems, weather, location);
            setInitialized(true);
            
            if (shouldShowTip && !dailyTipShown) {
              getDailyTip();
            }
          }
        }
      } catch (error) {
        console.error("Error loading garden state:", error);
      }
    };
    
    fetchGardenState();
  }, [initialized, dailyTipShown, isLoadingHistory]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const initializeAdvisor = async (patches: any[], plantedItems: Record<string, any[]>, weather: any, location: string) => {
    // If we have weather data and location, send a context message to the AI
    if (weather && weather.data && location) {
      try {
        const weatherSummary = summarizeWeather(weather);
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
  
  const summarizeWeather = (weather: any): string => {
    if (!weather || !weather.data || !weather.data.length) {
      return "unknown weather conditions";
    }
    
    try {
      // Get current temperature and precipitation from the first data point
      const tempData = weather.data.find((item: any) => item.parameter === "t_2m:C");
      const precipData = weather.data.find((item: any) => item.parameter === "precip_1h:mm");
      const windData = weather.data.find((item: any) => item.parameter === "wind_speed_10m:ms");
      
      let summary = "";
      
      if (tempData && tempData.coordinates[0].dates[0]) {
        const temp = tempData.coordinates[0].dates[0].value;
        summary += `${temp.toFixed(1)}°C`;
      }
      
      if (precipData && precipData.coordinates[0].dates[0]) {
        const precip = precipData.coordinates[0].dates[0].value;
        if (precip > 0) {
          summary += `, ${precip.toFixed(1)}mm precipitation`;
        } else {
          summary += ", no precipitation";
        }
      }
      
      if (windData && windData.coordinates[0].dates[0]) {
        const wind = windData.coordinates[0].dates[0].value;
        summary += `, wind ${wind.toFixed(1)}m/s`;
      }
      
      return summary;
    } catch (error) {
      console.error("Error summarizing weather:", error);
      return "unknown weather conditions";
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
          id: `tip-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, tipMessage]);
        
        // Store tip in database
        await supabase.from('advisor_chats').insert({
          role: tipMessage.role,
          content: tipMessage.content,
          timestamp: tipMessage.timestamp.toISOString()
        });
        
        // Mark that we've shown a tip today
        localStorage.setItem('last-garden-tip-timestamp', Date.now().toString());
        setDailyTipShown(true);
      }
    } catch (error) {
      console.error("Error getting daily tip:", error);
      toast.error("Couldn't get your daily gardening tip. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Store user message in database
      await supabase.from('advisor_chats').insert({
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString()
      });
      
      // Get response from garden advisor
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
        // Add assistant response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Store assistant message in database
        await supabase.from('advisor_chats').insert({
          role: assistantMessage.role,
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp.toISOString()
        });
      } else {
        throw new Error("Received invalid response from garden advisor");
      }
    } catch (error) {
      console.error("Error querying garden advisor:", error);
      toast.error("Couldn't connect to the garden advisor. Please try again later.");
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "Sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Store error message in database
      await supabase.from('advisor_chats').insert({
        role: errorMessage.role,
        content: errorMessage.content,
        timestamp: errorMessage.timestamp.toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    }).format(date);
  };
  
  // Render loading state
  if (isLoadingHistory) {
    return (
      <Card className="flex flex-col h-full border-green-200 bg-green-50">
        <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="mr-2 h-5 w-5" />
            Garden Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center flex-1 p-8">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="flex flex-col h-full border-green-200 bg-green-50">
      <CardHeader className="bg-green-700 text-white rounded-t-lg py-3">
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="mr-2 h-5 w-5" />
          Garden Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-green-600 text-white"
                  : message.role === "system"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-white text-green-800 border border-green-200"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === "user" ? "text-green-100" : "text-gray-500"
              }`}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t p-3 bg-green-100">
        <form onSubmit={handleSubmit} className="flex w-full items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your garden..."
              className="min-h-[80px] resize-none bg-white"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="bg-green-700 hover:bg-green-800"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Clock className="h-5 w-5 animate-spin" />
              ) : (
                <SendHorizonal className="h-5 w-5" />
              )}
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-green-200 hover:bg-green-300 border-green-300"
                >
                  <Sparkles className="h-5 w-5 text-green-700" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Questions</h4>
                  <div className="grid gap-2">
                    {[
                      "What should I plant this month?",
                      "How do I protect my plants from pests?",
                      "When should I water my garden?",
                      "What's the best fertilizer for my vegetables?",
                      "How can I improve my soil quality?"
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto py-2 px-3 text-sm"
                        onClick={() => {
                          setInput(suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
};
