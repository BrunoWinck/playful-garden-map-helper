
import React, { useEffect, useState } from "react";
import { supabase, ANONYMOUS_USER_ID } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface GardenImage {
  id: string;
  image_path: string;
  temperature: number;
  precipitation: number;
  uv_index: number;
  season: string;
  day_of_year: number;
  weather_condition: string;
  publicUrl?: string;
}

interface GardenImageCollageProps {
  weatherData?: {
    temperature?: number;
    precipitation?: number;
    uvIndex?: number;
    condition?: string;
  };
  className?: string;
}

export const GardenImageCollage: React.FC<GardenImageCollageProps> = ({
  weatherData,
  className
}) => {
  const [images, setImages] = useState<GardenImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarImages = async () => {
      if (!weatherData) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || ANONYMOUS_USER_ID;

        // Calculate current day of year for seasonal similarity
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const currentDayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        // Query for images with similar conditions
        const { data, error } = await supabase
          .from('garden_images')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setImages([]);
          setLoading(false);
          return;
        }

        // Process images and get public URLs
        const processedImages = await Promise.all(
          data.map(async (img) => {
            const { data: urlData } = supabase
              .storage
              .from('garden_images')
              .getPublicUrl(img.image_path);
            
            return { 
              ...img, 
              publicUrl: urlData.publicUrl 
            };
          })
        );

        // If we have weather data, sort by similarity
        if (weatherData.temperature !== undefined) {
          processedImages.sort((a, b) => {
            // Weight factors for sorting
            const tempWeightA = Math.abs(a.temperature - (weatherData.temperature || 0));
            const tempWeightB = Math.abs(b.temperature - (weatherData.temperature || 0));
            
            const precipWeightA = Math.abs(a.precipitation - (weatherData.precipitation || 0));
            const precipWeightB = Math.abs(b.precipitation - (weatherData.precipitation || 0));
            
            const uvWeightA = Math.abs(a.uv_index - (weatherData.uvIndex || 0));
            const uvWeightB = Math.abs(b.uv_index - (weatherData.uvIndex || 0));
            
            const dayWeightA = Math.abs(a.day_of_year - currentDayOfYear);
            const dayWeightB = Math.abs(b.day_of_year - currentDayOfYear);
            
            // Combined similarity score (lower is more similar)
            const similarityA = (tempWeightA * 4) + (precipWeightA * 3) + (uvWeightA * 2) + (dayWeightA * 1);
            const similarityB = (tempWeightB * 4) + (precipWeightB * 3) + (uvWeightB * 2) + (dayWeightB * 1);
            
            return similarityA - similarityB;
          });
        }

        setImages(processedImages);
        
        // Select a random image from the top 3 most similar for the background
        if (processedImages.length > 0) {
          const topImages = processedImages.slice(0, Math.min(3, processedImages.length));
          const randomIndex = Math.floor(Math.random() * topImages.length);
          setSelectedImage(topImages[randomIndex].publicUrl);
        }
      } catch (error) {
        console.error("Error fetching garden images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarImages();
  }, [weatherData]);

  if (loading) {
    return (
      <div className={`grid grid-cols-3 gap-1 p-1 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className="h-16 w-full bg-blue-500/30" />
        ))}
      </div>
    );
  }

  // Return blue gradient background if no images
  if (images.length === 0) {
    return (
      <div className={className}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg z-0" />
      </div>
    );
  }

  return (
    <div className={className}>
      {selectedImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-lg opacity-15 z-0" 
          style={{ backgroundImage: `url(${selectedImage})` }}
        />
      ) : (
        // Fallback gradient if selectedImage is null but we have images
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg z-0" />
      )}
      
      <div className="relative z-10 p-1">
        <div className="grid grid-cols-3 gap-1 mt-1">
          {images.slice(0, 6).map((image) => (
            <div 
              key={image.id} 
              className="h-12 rounded-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(image.publicUrl)}
            >
              <img 
                src={image.publicUrl} 
                alt={`Garden in ${image.weather_condition} conditions`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
