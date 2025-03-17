
import React, { ReactNode, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  isLoading?: boolean;
  loadingText?: string;
  col?: string;
  height?: string;
}

export const Widget = ({
  title,
  icon: Icon,
  children,
  col = "",
  height = "",
  footer = null,
  className = "",
  contentClassName = "",
  isLoading = false,
  loadingText = "Loading...",
}: WidgetProps) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
  <div className={col}>
    <div className={isMaximized ? "h-full" : height}> 
      <Card 
        className={`flex flex-col h-full border-green-200 bg-green-50 ${className} ${
          isMaximized ? "fixed inset-0 z-50 rounded-none" : ""
        }`}
      >
        <CardHeader className="p-0">
          <div className="bg-green-700 text-white rounded-t-lg py-3 px-4 flex justify-between items-center">
            <h2 className="flex items-center text-lg font-semibold">
              <Icon className="mr-2 h-5 w-5" />
              {title}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMaximize}
              className="h-8 w-8 rounded-full hover:bg-green-600 text-white"
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span className="sr-only">
                {isMaximized ? "Minimize" : "Maximize"}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent 
          className={`flex-1 p-0 overflow-hidden ${contentClassName} ${
            isMaximized ? "h-[calc(100vh-120px)]" : ""
          }`}
        >
          <ScrollArea className={`h-full ${isMaximized ? "max-h-full" : "max-h-[calc(100vh-300px)]"}`}>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
                  <span className="ml-3 text-green-700">{loadingText}</span>
                </div>
              ) : (
                children
              )}
            </div>
          </ScrollArea>
        </CardContent>
        {footer && (
          <CardFooter className="border-t p-3 bg-green-100">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  </div>
  );
};
