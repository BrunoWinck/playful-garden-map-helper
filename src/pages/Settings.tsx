
import React, { useEffect } from "react";
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
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  lengthUnit: z.enum(["metric", "imperial"]),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]),
  language: z.enum(["english", "french", "spanish", "german"]),
  location: z.string().refine(
    (val) => {
      const pattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
      return pattern.test(val);
    },
    {
      message: "Location must be in GPS format: latitude,longitude (e.g., 45.882550, 2.905965)",
    }
  ),
});

type FormValues = z.infer<typeof formSchema>;

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  
  const defaultValues: FormValues = {
    lengthUnit: "metric",
    temperatureUnit: "celsius",
    language: "english",
    location: "45.882550, 2.905965",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Load settings from Supabase or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // Try to get user settings from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data: userSettings, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (error) throw error;
          
          if (userSettings) {
            // Map database settings to form values
            const formValues = {
              lengthUnit: userSettings.length_unit as "metric" | "imperial",
              temperatureUnit: userSettings.temperature_unit as "celsius" | "fahrenheit",
              language: userSettings.language as "english" | "french" | "spanish" | "german",
              location: userSettings.location,
            };
            
            form.reset(formValues);
            console.log("Settings loaded from Supabase:", formValues);
            
            // Also update localStorage for components that still use it
            localStorage.setItem("gardenSettings", JSON.stringify(formValues));
            
            setLoading(false);
            return;
          }
        }
        
        // Fallback to localStorage if not found in Supabase
        const savedSettings = localStorage.getItem("gardenSettings");
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            form.reset(parsedSettings);
            console.log("Settings loaded from localStorage:", parsedSettings);
          } catch (error) {
            console.error("Error parsing saved settings:", error);
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Save to localStorage for backward compatibility
      localStorage.setItem("gardenSettings", JSON.stringify(data));
      
      // Save to Supabase if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Convert form values to database format
        const dbSettings = {
          user_id: session.user.id,
          length_unit: data.lengthUnit,
          temperature_unit: data.temperatureUnit,
          language: data.language,
          location: data.location,
          updated_at: new Date().toISOString(),
        };
        
        // Check if settings already exist for this user
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (existingSettings) {
          // Update existing settings
          const { error } = await supabase
            .from('user_settings')
            .update(dbSettings)
            .eq('user_id', session.user.id);
          
          if (error) throw error;
        } else {
          // Insert new settings
          const { error } = await supabase
            .from('user_settings')
            .insert(dbSettings);
          
          if (error) throw error;
        }
        
        toast.success("Settings saved to your account");
      } else {
        toast.success("Settings saved locally");
      }
      
      console.log("Settings saved:", data);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Detecting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        form.setValue("location", locationString, { shouldValidate: true });
        toast.success("Location detected successfully!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Could not detect your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        toast.error(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
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

      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : (
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
                      <FormLabel>Location (GPS Coordinates)</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input 
                            placeholder="e.g. 45.882550, 2.905965" 
                            {...field} 
                            className="flex-1"
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={handleGetLocation}
                          title="Detect my location"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Enter coordinates as latitude,longitude (e.g., 45.882550, 2.905965) for weather forecasts and growing recommendations.
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
      )}
    </div>
  );
};

export default Settings;
