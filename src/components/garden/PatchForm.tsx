
import React, { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { PatchType, PlacementType, PatchFormValues, Patch } from "@/lib/types";

interface PatchFormProps {
  onSubmit: (data: PatchFormValues) => Promise<void>;
  initialValues?: PatchFormValues;
  isEditing: boolean;
  availableParentPatches?: Patch[]; // Prop for available parent patches
}

export const PatchForm = ({ 
  onSubmit, 
  initialValues, 
  isEditing,
  availableParentPatches = [] 
}: PatchFormProps) => {
  const form = useForm<PatchFormValues>({
    defaultValues: initialValues || {
      name: "",
      length: 2,
      width: 2,
      type: "outdoor-soil" as PatchType,
      heated: false,
      artificialLight: false,
      naturalLightPercentage: 100,
      placementType: "free" as PlacementType,
      slotsLength: 4,
      slotsWidth: 6,
      containingPatchId: undefined,
      task: ""
    }
  });
  
  const watchType = form.watch("type");
  const watchPlacementType = form.watch("placementType");
  
  useEffect(() => {
    if (watchType === "outdoor-soil") {
      form.setValue("heated", false);
      form.setValue("artificialLight", false);
    }
  }, [watchType, form]);

  const handleFormSubmit = async (data: PatchFormValues) => {
    console.log("PatchForm submit with data:", data);
    try {
      await onSubmit(data);
      // Reset form after successful submission if not editing
      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-green-700">Patch Name</FormLabel>
                <FormControl>
                  <Input placeholder="Vegetable Patch" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="containingPatchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-green-700">Containing Patch (Optional)</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select containing patch (if any)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {availableParentPatches.map((patch) => (
                      <SelectItem key={patch.id} value={patch.id}>
                        {patch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Length (m)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0.5" 
                      max="10" 
                      step="0.5" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Width (m)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0.5" 
                      max="10" 
                      step="0.5" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-green-700">Patch Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patch type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="outdoor-soil">Outdoor Soil</SelectItem>
                    <SelectItem value="perennials">Perennials</SelectItem>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="protected">Protected</SelectItem>
                    <SelectItem value="template">Template Tray</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="placementType"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-green-700 pt-1">Plant Placement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-1"
                      value={field.value}
                    >
                      <div className="flex items-center space-x-1 border rounded-l-md px-2 py-1">
                        <RadioGroupItem value="free" id="free" />
                        <FormLabel htmlFor="free" className="cursor-pointer text-xs">Free</FormLabel>
                      </div>
                      <div className="flex items-center space-x-1 border rounded-r-md px-2 py-1">
                        <RadioGroupItem value="slots" id="slots" />
                        <FormLabel htmlFor="slots" className="cursor-pointer text-xs">Slots</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          
          {watchPlacementType === "slots" && (
            <FormItem className="p-2 border rounded-md bg-green-50">
              <div className="flex items-center space-x-1">
                <FormLabel className="text-green-700 text-xs whitespace-nowrap">Slots:</FormLabel>
                <FormField
                  control={form.control}
                  name="slotsWidth"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="99" 
                        step="1"
                        className="w-12 h-7 px-1 py-0 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        value={field.value}
                      />
                    </FormControl>
                  )}
                />
                <span className="text-xs">×</span>
                <FormField
                  control={form.control}
                  name="slotsLength"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="99" 
                        step="1"
                        className="w-12 h-7 px-1 py-0 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        value={field.value}
                      />
                    </FormControl>
                  )}
                />
                <span className="text-xs whitespace-nowrap">=</span>
                <span className="text-xs text-green-800">{form.watch("slotsLength") * form.watch("slotsWidth")} slots</span>
              </div>
            </FormItem>
          )}

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="heated"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-2">
                  <FormLabel className="text-sm">Heated</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={watchType === "outdoor-soil"}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artificialLight"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-2">
                  <FormLabel className="text-sm">Artificial Light</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={watchType === "outdoor-soil"}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="naturalLightPercentage"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-green-700 text-xs">
                  Natural Light: {field.value}%
                </FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="py-2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isEditing ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Update Patch
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Patch
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
