
import React, { useState } from "react";
import { PlantItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlantVariety } from "@/services/plantService";

interface AddVarietyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plant: PlantItem | null;
  onVarietyAdded: (newVariety: PlantItem) => void;
}

export const AddVarietyDialog = ({ 
  isOpen, 
  onClose, 
  plant, 
  onVarietyAdded 
}: AddVarietyDialogProps) => {
  const [varietyName, setVarietyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plant || !varietyName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const newVariety = await createPlantVariety(plant, varietyName.trim());
      if (newVariety) {
        onVarietyAdded(newVariety);
        setVarietyName("");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Plant Variety</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{plant?.icon}</div>
              <div>
                <p className="text-md font-medium">{plant?.name}</p>
                <p className="text-sm text-muted-foreground">{plant?.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="variety-name" className="text-right">
                Variety Name
              </Label>
              <Input
                id="variety-name"
                value={varietyName}
                onChange={(e) => setVarietyName(e.target.value)}
                className="col-span-3"
                placeholder={`${plant?.name} variety`}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !varietyName.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Variety"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
