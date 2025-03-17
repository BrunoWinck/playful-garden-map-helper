
import React from "react";
import { LucideIcon } from "lucide-react";

interface WidgetHeaderProps {
  title: string;
  icon: LucideIcon;
}

export const WidgetHeader = ({ title, icon: Icon }: WidgetHeaderProps) => {
  return (
    <div className="bg-green-700 text-white rounded-t-lg py-3 px-4 mb-4">
      <h2 className="flex items-center text-lg font-semibold">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h2>
    </div>
  );
};
