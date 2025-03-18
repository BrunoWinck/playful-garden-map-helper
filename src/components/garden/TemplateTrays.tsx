
import React, { useState, useEffect } from "react";
import { Patch } from "@/lib/types";
import { fetchPatches } from "@/services/patchService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid2X2, Rows3, ThermometerSun, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useDrag } from "react-dnd";

const TemplateTrayItem = ({ tray }: { tray: Patch }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TEMPLATE_TRAY",
    item: () => ({ tray }), // Use item function to return the drag data
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    // Handle drag start and end events within the useDrag hook
    end: () => {
      document.dispatchEvent(new CustomEvent('plantDragEnd'));
    },
    // Use the proper API for react-dnd v14+
    hover: (item, monitor) => {
      // Only fire plantDragStart once at the beginning of the drag
      if (monitor.isDragging() && !monitor.didDrop()) {
        const clientOffset = monitor.getClientOffset();
        if (clientOffset && !isDragging) {
          document.dispatchEvent(new CustomEvent('plantDragStart'));
        }
      }
    }
  }));

  return (
    <div
      ref={drag}
      className={`cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ touchAction: "none" }}
    >
      <Card className="h-full hover:border-green-500 transition-colors">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{tray.name}</CardTitle>
          <CardDescription className="text-xs">Template Tray</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-xs">
              <Grid2X2 className="h-3 w-3 mr-1" />
              {tray.placementType === "slots" ? (
                <span>{tray.slotsLength} x {tray.slotsWidth} slots</span>
              ) : (
                <span>{tray.length}m x {tray.width}m</span>
              )}
            </div>
            {tray.heated && (
              <div className="flex items-center text-xs text-orange-600">
                <ThermometerSun className="h-3 w-3 mr-1" />
                <span>Heated</span>
              </div>
            )}
            {tray.artificialLight && (
              <div className="flex items-center text-xs text-yellow-600">
                <Lightbulb className="h-3 w-3 mr-1" />
                <span>Artificial Light</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const TemplateTrays = () => {
  const [templateTrays, setTemplateTrays] = useState<Patch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplateTrays = async () => {
      setIsLoading(true);
      try {
        const patches = await fetchPatches();
        const trays = patches.filter(patch => patch.type === "template");
        setTemplateTrays(trays);
      } catch (error) {
        console.error("Error loading template trays:", error);
        toast.error("Failed to load template trays");
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateTrays();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading template trays...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Template Trays</h3>
      {templateTrays.length === 0 ? (
        <p className="text-sm text-gray-500">
          No template trays available. Create some using the "Add Patch" button and selecting "Template Tray" type.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templateTrays.map((tray) => (
            <TemplateTrayItem key={tray.id} tray={tray} />
          ))}
        </div>
      )}
    </div>
  );
};
