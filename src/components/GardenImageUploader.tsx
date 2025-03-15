
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";

interface GardenImageUploaderProps {
  onImageUploaded?: (imagePath: string) => void;
  weatherData?: {
    temperature: number;
    precipitation: number;
    uvIndex?: number;
    condition: string;
  };
}

export const GardenImageUploader: React.FC<GardenImageUploaderProps> = ({
  onImageUploaded,
  weatherData
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    if (!weatherData) {
      toast({
        title: "Weather data missing",
        description: "Cannot upload image without weather data",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || ANONYMOUS_USER_ID;

      // Create a unique file name with timestamp to avoid overwriting
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase
        .storage
        .from('garden_images')
        .upload(filePath, selectedImage);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('garden_images')
        .getPublicUrl(filePath);

      // Save metadata to the garden_images table
      const { error: metadataError } = await supabase
        .from('garden_images')
        .insert({
          user_id: userId,
          image_path: filePath,
          temperature: weatherData.temperature,
          precipitation: weatherData.precipitation,
          uv_index: weatherData.uvIndex || 0,
          weather_condition: weatherData.condition
        });

      if (metadataError) {
        throw metadataError;
      }

      toast({
        title: "Image uploaded successfully",
        description: "Your garden image has been saved"
      });

      clearSelectedImage();
      if (onImageUploaded) {
        onImageUploaded(publicUrlData.publicUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload garden image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input 
          id="garden-image"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <label 
          htmlFor="garden-image" 
          className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-md cursor-pointer hover:bg-green-200 transition-colors"
        >
          <Camera size={18} />
          <span>Select garden photo</span>
        </label>
        {selectedImage && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSelectedImage}
            type="button"
          >
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {previewUrl && (
        <div className="relative mt-2">
          <img 
            src={previewUrl} 
            alt="Garden preview" 
            className="max-h-40 rounded-md object-cover"
          />
          <Button
            onClick={uploadImage}
            disabled={uploading}
            className="mt-2 bg-green-600 hover:bg-green-700"
          >
            <Upload size={16} className="mr-1" />
            {uploading ? "Uploading..." : "Upload to your garden gallery"}
          </Button>
        </div>
      )}
    </div>
  );
};
