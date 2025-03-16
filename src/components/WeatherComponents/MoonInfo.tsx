
import React, { useEffect, useState } from "react";
import { getHighestMoonAltitude, getMoonPhase } from "@/lib/moonCalculations";
import { 
  Moon, MoonStar, Sun, SunMoon, 
  ArrowUp, ArrowDown, 
  Clock 
} from "lucide-react";
import { format } from "date-fns";
import { utcToLocalTime } from "@/lib/solarCalculations";

interface MoonInfoProps {
  latitude: number;
  longitude: number;
}

export const MoonInfo: React.FC<MoonInfoProps> = ({ latitude, longitude }) => {
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [highestAltitude, setHighestAltitude] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    // Calculate moon phase
    const phaseData = getMoonPhase(today, latitude, longitude);
    setMoonPhase(phaseData);

    // Calculate highest moon altitude
    const altitudeData = getHighestMoonAltitude(today, latitude, longitude);
    setHighestAltitude(altitudeData);
  }, [latitude, longitude]);

  // Render moon phase icon based on the phase name
  const renderMoonPhaseIcon = () => {
    if (!moonPhase) return null;

    switch (moonPhase.phaseName) {
      case "New Moon":
        return <Moon className="h-5 w-5 text-slate-400" />;
      case "Waxing Crescent":
        return <Moon className="h-5 w-5 text-slate-600" />;
      case "First Quarter":
        return <MoonStar className="h-5 w-5 text-slate-700" />;
      case "Waxing Gibbous":
        return <MoonStar className="h-5 w-5 text-slate-800" />;
      case "Full Moon":
        return <Moon className="h-5 w-5 text-yellow-400" />;
      case "Waning Gibbous":
        return <SunMoon className="h-5 w-5 text-slate-800" />;
      case "Last Quarter":
        return <SunMoon className="h-5 w-5 text-slate-700" />;
      case "Waning Crescent":
        return <Moon className="h-5 w-5 text-slate-600" />;
      default:
        return <Moon className="h-5 w-5 text-slate-500" />;
    }
  };

  // Format local time from UTC
  const formatLocalTime = (date: Date) => {
    if (!date) return "";
    return utcToLocalTime(format(date, "HH:mm"));
  };

  // If data is not available yet
  if (!moonPhase || !highestAltitude) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Moon Phase Information */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center text-gray-600 space-x-1">
            {renderMoonPhaseIcon()}
            <span className="font-medium">{moonPhase.phaseName}</span>
          </div>
          <div className="text-gray-500 text-xs">
            {Math.round(moonPhase.illumination * 100)}% illuminated
          </div>
        </div>

        {/* Highest Altitude Information */}
        <div className="flex items-center justify-end space-x-2 text-sm">
          <div className="flex items-center space-x-1 text-gray-600">
            {highestAltitude.altitude > 0 ? (
              <ArrowUp className="h-4 w-4 text-sky-600" />
            ) : (
              <ArrowDown className="h-4 w-4 text-amber-600" />
            )}
            <span className="font-medium">
              {Math.abs(highestAltitude.altitude)}° {highestAltitude.altitude > 0 ? "above" : "below"} horizon
            </span>
          </div>
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>at {formatLocalTime(highestAltitude.time)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
