
import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Clock } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useGardenAdvisor } from "@/hooks/useGardenAdvisor";
import { useHiddenMessages } from "@/hooks/useHiddenMessages";

export const GardenAdvisor = () => {
  const { 
    messages, 
    input, 
    setInput, 
    isLoading, 
    isLoadingHistory,
    isInputFocused, 
    setIsInputFocused, 
    handleSubmit 
  } = useGardenAdvisor();
  
  const { 
    isLoading: isLoadingHiddenMessages, 
    toggleMessageVisibility, 
    isMessageHidden 
  } = useHiddenMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (isLoadingHistory || isLoadingHiddenMessages) {
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
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
          <div className="p-4 space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isHidden={isMessageHidden(message.id)}
                toggleVisibility={toggleMessageVisibility}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3 bg-green-100">
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
          handleSubmit={handleSubmit}
        />
      </CardFooter>
    </Card>
  );
};
