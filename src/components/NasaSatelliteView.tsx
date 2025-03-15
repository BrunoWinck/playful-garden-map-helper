
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNasaImagery } from "@/hooks/useNasaImagery";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface NasaSatelliteViewProps {
  lat?: number;
  lon?: number;
  date?: string;
  className?: string;
}

export const NasaSatelliteView: React.FC<NasaSatelliteViewProps> = ({ 
  lat = 45.882550, // Default coordinates if not provided
  lon = 2.905965,
  date,
  className 
}) => {
  const { imageUrl, loading, error } = useNasaImagery({ 
    lat, 
    lon, 
    date, 
    dim: 0.1 // Higher dimension value for more detailed image
  });
  
  const formattedDate = date 
    ? format(new Date(date), 'MMMM d, yyyy')
    : 'Recent';
  
  // Error state
  if (error) {
    return (
      <Card className={`w-full bg-white ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-600">Satellite Image Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              NASA's satellite imagery might not be available for this location or date.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-green-700">
          {formattedDate} Satellite View
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="w-full aspect-square relative">
            <Skeleton className="w-full h-full absolute" />
          </div>
        ) : (
          <>
            {imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt={`Satellite view from ${formattedDate}`}
                  className="w-full rounded-md shadow-sm"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  NASA Earth Imagery
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-700">No satellite image available</p>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
