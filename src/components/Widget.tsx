
import React, { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon } from "lucide-react";

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
  return (
  <div className={col}>
    <div className={height}> 
      <Card className={`flex flex-col h-full border-green-200 bg-green-50 ${className}`}>
        <CardHeader className="p-0">
          <div className="bg-green-700 text-white rounded-t-lg py-3 px-4">
            <h2 className="flex items-center text-lg font-semibold">
              <Icon className="mr-2 h-5 w-5" />
              {title}
            </h2>
          </div>
        </CardHeader>
        <CardContent className={`flex-1 p-0 overflow-hidden ${contentClassName}`}>
          <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
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
