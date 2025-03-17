
import React, { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { PatchType, PlacementType, PatchFormValues } from "@/lib/types";

interface PatchFormProps {
  onSubmit: (data: PatchFormValues) => Promise<void>;
  initialValues?: PatchFormValues;
  isEditing: boolean;
}

export const PatchForm = ({ onSubmit, initialValues, isEditing }: PatchFormProps) => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
          
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-700">Length (m)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0.5" max="10" step="0.5" {...field} />
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
                    <Input type="number" min="0.5" max="10" step="0.5" {...field} />
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
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="placementType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-green-700">Plant Placement</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-1"
                  >
                    <div className="flex items-center space-x-2 border rounded-l-md px-3 py-2">
                      <RadioGroupItem value="free" id="free" />
                      <FormLabel htmlFor="free" className="cursor-pointer">Free Placement</FormLabel>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-r-md px-3 py-2">
                      <RadioGroupItem value="slots" id="slots" />
                      <FormLabel htmlFor="slots" className="cursor-pointer">Seed Tray Slots</FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          
          {watchPlacementType === "slots" && (
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-green-50">
              <FormField
                control={form.control}
                name="slotsLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Slots in Length</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="20" 
                        step="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slotsWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Slots in Width</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="20" 
                        step="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="col-span-2 text-xs text-green-800 flex justify-center items-center pt-1">
                Total: {form.watch("slotsLength") * form.watch("slotsWidth")} slots
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="heated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Heated</FormLabel>
                  </div>
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Artificial Light</FormLabel>
                  </div>
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
              <FormItem>
                <FormLabel className="text-green-700">
                  Natural Light: {field.value}%
                </FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="py-4"
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
