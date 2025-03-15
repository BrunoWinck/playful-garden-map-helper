
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useNasaImagery } from "@/hooks/useNasaImagery";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Bug, Info, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  
  const { imageUrl, loading, error, debugInfo } = useNasaImagery({ 
    lat, 
    lon, 
    date, 
    dim: 0.1, // Higher dimension value for more detailed image
    key: refreshKey // Add refresh key to dependencies
  });
  
  const formattedDate = date 
    ? format(new Date(date), 'MMMM d, yyyy')
    : 'Recent';
    
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Debug panel
  const renderDebugInfo = () => {
    if (!debugInfo) return <p className="text-sm text-gray-500">No debug information available</p>;
    
    return (
      <div className="text-xs font-mono overflow-x-auto bg-gray-100 p-2 rounded">
        <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  };
  
  // Error state
  if (error) {
    return (
      <Card className={`w-full bg-white ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-600 flex items-center justify-between">
            <span>Satellite Image Error</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-2">
              NASA's satellite imagery might not be available for this location or date.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="h-4 w-4 mr-2" />
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </Button>
          </div>
          
          {showDebug && (
            <Collapsible open={showDebug} className="mt-2">
              <CollapsibleContent>{renderDebugInfo()}</CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-green-700 flex items-center justify-between">
          <span>{formattedDate} Satellite View</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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
                  onError={(e) => {
                    console.error('[NASA Imagery] Image loading error:', e);
                    e.currentTarget.style.display = 'none';
                    setError('Failed to load satellite image. NASA API may be rate-limited or the image is unavailable.');
                  }}
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
      
      {showDebug && (
        <CardFooter className="px-4 py-2 bg-gray-50 border-t">
          <Collapsible open={showDebug} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2 w-full flex items-center justify-between">
                <span>Debug Information</span>
                <Info className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>{renderDebugInfo()}</CollapsibleContent>
          </Collapsible>
        </CardFooter>
      )}
    </Card>
  );
};
