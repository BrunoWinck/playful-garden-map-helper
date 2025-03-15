
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  lengthUnit: z.enum(["metric", "imperial"]),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]),
  language: z.enum(["english", "french", "spanish", "german"]),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const Settings = () => {
  const navigate = useNavigate();
  
  // In a real app, we would fetch these from localStorage or an API
  const defaultValues: FormValues = {
    lengthUnit: "metric",
    temperatureUnit: "celsius",
    language: "english",
    location: "New York, USA",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: FormValues) => {
    // Save settings to localStorage
    localStorage.setItem("gardenSettings", JSON.stringify(data));
    toast.success("Settings saved successfully!");
    console.log("Settings saved:", data);
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-green-800">Settings</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Unit Preferences</CardTitle>
              <CardDescription>Choose your preferred measurement units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="lengthUnit"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Length Unit</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="metric" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Metric (cm, m)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="imperial" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Imperial (inch, feet)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatureUnit"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Temperature Unit</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="celsius" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Celsius (°C)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="fahrenheit" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Fahrenheit (°F)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language & Location</CardTitle>
              <CardDescription>Choose your preferred language and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This will change the language of the interface.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York, USA" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your location helps with weather forecasts and growing recommendations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Settings;
