
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SendHorizonal, Clock, Sparkles } from "lucide-react";
import { QuickQueryOptions } from "@/components/QuickQueryOptions";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  isInputFocused: boolean;
  setIsInputFocused: (focused: boolean) => void;
  handleSubmit: (event: React.FormEvent) => void;
}

export const ChatInput = ({ 
  input, 
  setInput, 
  isLoading, 
  isInputFocused, 
  setIsInputFocused, 
  handleSubmit 
}: ChatInputProps) => {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-2">
      <div className="flex items-end gap-2 relative">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 100)}
            placeholder="Ask about your garden..."
            className="min-h-[80px] resize-none bg-white"
            disabled={isLoading}
          />
          
          {input === "" && !isInputFocused && (
            <QuickQueryOptions 
              setInput={setInput}
              handleSubmit={handleSubmit}
              setIsInputFocused={setIsInputFocused}
            />
          )}
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
                        setIsInputFocused(true);
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
      </div>
    </form>
  );
};
