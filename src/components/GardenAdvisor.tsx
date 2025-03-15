
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Lightbulb, SendHorizonal, Sparkles, Clock, BookOpen, CheckSquare } from "lucide-react";
import { supabase, ANONYMOUS_USER_ID, ANONYMOUS_USER_NAME } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { GlossaryTerm } from "./GlossaryPanel";
import { remarkGlossarySyntax, remarkTaskSyntax } from "@/utils/remarkPlugins";

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
  
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
          .from('advisor_chats')
          .select('*')
          .eq('user_id', ANONYMOUS_USER_ID)
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
          console.log("Loaded chat history:", formattedMessages.length, "messages");
        } else {
          const welcomeMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Hello! I'm your garden advisor. I can help with plant care, pest management, garden planning, and more. How can I assist you today?",
            timestamp: new Date()
          };
          
          setMessages([welcomeMessage]);
          
          await storeMessage(welcomeMessage);
          
          console.log("No chat history found, created welcome message");
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
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
    
    fetchChatHistory();
  }, []);
  
  const storeMessage = async (message: Message) => {
    try {
      console.log("Storing message:", message);
      console.log("Message ID:", message.id);
      console.log("Message ID type:", typeof message.id);
      
      const { error } = await supabase.from('advisor_chats').insert({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        user_id: ANONYMOUS_USER_ID
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
  
  useEffect(() => {
    const fetchGardenState = async () => {
      try {
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
          const storedPatches = localStorage.getItem('garden-patches');
          patches = storedPatches ? JSON.parse(storedPatches) : [];
        }
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('patch_tasks')
          .select('*');
          
        let plantedItems: Record<string, any[]> = {};
        if (!tasksError && tasksData) {
          tasksData.forEach(task => {
            if (!plantedItems[task.patch_id]) {
              plantedItems[task.patch_id] = [];
            }
            plantedItems[task.patch_id].push(task.task);
          });
        } else {
          const storedPlantedItems = localStorage.getItem('garden-planted-items');
          plantedItems = storedPlantedItems ? JSON.parse(storedPlantedItems) : {};
        }
        
        const weather = JSON.parse(localStorage.getItem('weather-data') || '{}');
        
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
        
        const lastTipTimestamp = localStorage.getItem('last-garden-tip-timestamp');
        const shouldShowTip = !lastTipTimestamp || 
          (Date.now() - parseInt(lastTipTimestamp, 10)) > 24 * 60 * 60 * 1000;
        
        if (!initialized) {
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
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const initializeAdvisor = async (patches: any[], plantedItems: Record<string, any[]>, weather: any, location: string) => {
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
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, tipMessage]);
        
        await storeMessage(tipMessage);
        
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
  
  const addToGlossary = (term: string) => {
    try {
      const storedTerms = localStorage.getItem('glossary-terms');
      const terms: GlossaryTerm[] = storedTerms ? JSON.parse(storedTerms) : [];
      
      if (terms.some(t => t.term.toLowerCase() === term.toLowerCase())) {
        return;
      }
      
      const newTerm: GlossaryTerm = {
        id: crypto.randomUUID(),
        term: term,
        definition: `Add your definition for "${term}" here.`,
        created_at: new Date().toISOString()
      };
      
      terms.push(newTerm);
      localStorage.setItem('glossary-terms', JSON.stringify(terms));
      
      supabase
        .from('glossary_terms')
        .insert({
          term: term,
          definition: `Add your definition for "${term}" here.`,
          user_id: ANONYMOUS_USER_ID
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save glossary term to database:", error);
          }
        });
      
      toast.success(`Added "${term}" to your gardening glossary`, {
        action: {
          label: "View Glossary",
          onClick: () => {
            document.getElementById("glossary-panel-trigger")?.click();
          }
        }
      });
    } catch (error) {
      console.error("Error adding term to glossary:", error);
    }
  };
  
  const addToTasks = (task: string) => {
    try {
      const storedTasks = localStorage.getItem('garden-tasks');
      const tasks: {id: string, text: string, completed: boolean, createdAt: string}[] = 
        storedTasks ? JSON.parse(storedTasks) : [];
      
      if (tasks.some(t => t.text.toLowerCase() === task.toLowerCase())) {
        return;
      }
      
      const newTask = {
        id: crypto.randomUUID(),
        text: task,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      tasks.push(newTask);
      localStorage.setItem('garden-tasks', JSON.stringify(tasks));
      
      supabase
        .from('patch_tasks')
        .insert({
          task: task,
          user_id: ANONYMOUS_USER_ID,
          patch_id: "general"
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save task to database:", error);
          }
        });
      
      toast.success(`Added "${task}" to your garden tasks`, {
        action: {
          label: "View Tasks",
          onClick: () => {
          }
        }
      });
    } catch (error) {
      console.error("Error adding task:", error);
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
      const userMessageStored = await storeMessage(userMessage);
      
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
        
        const assistantMessageStored = await storeMessage(assistantMessage);
        
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
      
      await storeMessage(errorMessage);
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
  
  const MarkdownRenderer = ({ content, isUser }: { content: string, isUser: boolean }) => {
    if (isUser) {
      return (
        <div className="text-white whitespace-pre-wrap">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    const components = {
      p: ({children}) => <p className="mb-2">{children}</p>,
      h1: ({children}) => <h1 className="text-xl font-bold mb-2 text-green-700">{children}</h1>,
      h2: ({children}) => <h2 className="text-lg font-bold mb-2 text-green-700">{children}</h2>,
      h3: ({children}) => <h3 className="text-md font-bold mb-2 text-green-700">{children}</h3>,
      ul: ({children}) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
      ol: ({children}) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
      li: ({children}) => <li className="mb-1">{children}</li>,
      a: ({href, children}) => <a href={href} className="underline text-green-600 hover:opacity-80">{children}</a>,
      code: ({className, children}) => {
        const isMultiline = className?.includes("language-");
        if (isMultiline) {
          return <code className="block p-2 rounded my-2 font-mono text-sm bg-green-100 text-green-800">{children}</code>;
        }
        return <code className="px-1 py-0.5 rounded bg-green-100 text-green-800">{children}</code>;
      },
      blockquote: ({children}) => <blockquote className="border-l-4 pl-4 italic my-2 border-green-300">{children}</blockquote>,
      hr: () => <hr className="my-2 border-green-200" />,
      
      glossaryTerm: ({ node }: any) => {
        const term = node.value;
        setTimeout(() => addToGlossary(term), 0);
        return (
          <span 
            className="glossary-term bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 transition-colors inline-flex items-center"
            title="Click to view in glossary"
            onClick={() => {
              document.getElementById("glossary-panel-trigger")?.click();
            }}
          >
            <BookOpen className="inline-block h-3 w-3 mr-1" />
            {term}
          </span>
        );
      },
      taskItem: ({ node }: any) => {
        const task = node.value;
        setTimeout(() => addToTasks(task), 0);
        return (
          <span 
            className="task-item bg-yellow-100 px-1 rounded cursor-pointer hover:bg-yellow-200 transition-colors inline-flex items-center"
            title="Click to add to tasks"
            onClick={() => addToTasks(task)}
          >
            <CheckSquare className="inline-block h-3 w-3 mr-1" />
            {task}
          </span>
        );
      }
    };

    return (
      <div className="text-green-800">
        <ReactMarkdown
          remarkPlugins={[remarkGlossarySyntax, remarkTaskSyntax]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };
  
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
              {message.role === "system" ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <MarkdownRenderer 
                  content={message.content} 
                  isUser={message.role === "user"} 
                />
              )}
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
