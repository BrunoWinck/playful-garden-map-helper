
import React, { useRef, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useGardenAdvisor } from "@/hooks/useGardenAdvisor";
import { useHiddenMessages } from "@/hooks/useHiddenMessages";
import { Widget } from "./Widget";

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
  
  return (
    <Widget
      title="Garden Advisor"
      icon={Lightbulb}
      isLoading={isLoadingHistory || isLoadingHiddenMessages}
      loadingText="Loading conversation history..."
      contentClassName="space-y-2"
      footer={
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
          handleSubmit={handleSubmit}
        />
      }
    >
      <div className="space-y-2">
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
    </Widget>
  );
};
