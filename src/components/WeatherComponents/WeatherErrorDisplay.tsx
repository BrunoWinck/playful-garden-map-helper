
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud } from "lucide-react";

interface WeatherErrorDisplayProps {
  error: string;
}

export const WeatherErrorDisplay: React.FC<WeatherErrorDisplayProps> = ({ error }) => {
  return (
    <Card className="w-full bg-white">
      <CardContent className="p-6 text-center">
        <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-red-500">{error}</p>
        <p className="text-gray-500 mt-2">Please check your connection and try again.</p>
      </CardContent>
    </Card>
  );
};
