
import React from "react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/GardenMarkdown";
import { EyeOff, Eye } from "lucide-react";
import { Message } from "@/lib/chatUtils";
import { formatTimestamp } from "@/lib/chatUtils";

interface ChatMessageProps {
  message: Message;
  isHidden: boolean;
  toggleVisibility: (messageId: string) => void;
}

export const ChatMessage = ({ message, isHidden, toggleVisibility }: ChatMessageProps) => {
  if (isHidden) {
    return (
      <div className="py-0.5">
        <div className="flex items-center justify-between px-3 py-0.5 bg-green-50 border border-green-200 rounded text-xs text-gray-500">
          <span>
            {message.role === "user" ? "Your message" : "Advisor response"} • {formatTimestamp(message.timestamp)}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleVisibility(message.id)}
            className="h-5 w-5"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div
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
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1">
              {message.role === "system" ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <MarkdownRenderer 
                  content={message.content} 
                  isUser={message.role === "user"} 
                />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleVisibility(message.id)}
              className={`ml-2 h-6 w-6 -mt-1 -mr-1 ${
                message.role === "user" 
                  ? "text-green-200 hover:text-white hover:bg-green-700" 
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className={`text-xs mt-1 ${
            message.role === "user" ? "text-green-100" : "text-gray-500"
          }`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};
