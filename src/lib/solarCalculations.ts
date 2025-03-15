
/**
 * Solar Position Algorithm (SPA) Implementation
 * This module provides functions to compute sunrise and sunset times using 
 * a simplified version of the Solar Position Algorithm through Solar Declination 
 * and Hour Angle formulas.
 */

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Computes the approximate solar declination angle in degrees.
 * Solar Declination represents the Sun's tilt for a given day.
 * 
 * @param dayOfYear - Day of the year (1 to 365)
 * @returns Solar declination in degrees
 */
function solarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin(toRadians((360 / 365) * (dayOfYear - 81)));
}

/**
 * Computes the hour angle for sunrise or sunset.
 * Hour Angle represents the angular distance of the Sun from the observer's meridian at sunrise/sunset.
 * 
 * @param latitude - Latitude in degrees
 * @param declination - Solar declination in degrees
 * @returns Hour angle in degrees
 */
function hourAngle(latitude: number, declination: number): number {
  return toDegrees(
    Math.acos(
      Math.cos(toRadians(90.833)) /
        (Math.cos(toRadians(latitude)) * Math.cos(toRadians(declination))) -
        Math.tan(toRadians(latitude)) * Math.tan(toRadians(declination))
    )
  );
}

/**
 * Computes the solar noon in UTC.
 * Solar Noon determines when the Sun is at its highest point.
 * 
 * @param longitude - Longitude in degrees
 * @returns Solar noon in hours (UTC)
 */
function solarNoon(longitude: number): number {
  return 12 - longitude / 15;
}

/**
 * Gets the day of the year (1-365) from a Date object
 * 
 * @param date - Date object
 * @returns Day of the year (1-365)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Computes sunrise and sunset times in UTC.
 * Sunrise/Sunset Calculation adjusts for the Earth's rotation (1 hour = 15° longitude).
 * 
 * @param dayOfYear - Day of the year (1 to 365)
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees
 * @returns Object containing sunrise and sunset times in "HH:MM" format (UTC)
 */
export function computeSunriseSunset(
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: string; sunset: string } {
  const dayOfYear = getDayOfYear(date);
  const declination = solarDeclination(dayOfYear);
  const ha = hourAngle(latitude, declination);
  const noonUTC = solarNoon(longitude);

  const sunriseUTC = noonUTC - ha / 15;
  const sunsetUTC = noonUTC + ha / 15;

  return {
    sunrise: formatTime(sunriseUTC),
    sunset: formatTime(sunsetUTC),
  };
}

/**
 * Formats hours as "HH:MM"
 * 
 * @param hours - Hours (can include decimal for minutes)
 * @returns Time in "HH:MM" format
 */
function formatTime(hours: number): string {
  // Handle cases where the time might be negative or over 24 hours
  hours = (hours + 24) % 24;
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  // Handle case where minutes round to 60
  let formattedHours = h;
  let formattedMinutes = m;
  
  if (formattedMinutes === 60) {
    formattedMinutes = 0;
    formattedHours = (formattedHours + 1) % 24;
  }
  
  return `${formattedHours.toString().padStart(2, "0")}:${formattedMinutes.toString().padStart(2, "0")}`;
}

/**
 * Convert UTC time string to local time string based on the browser's timezone
 * 
 * @param utcTimeStr - Time in "HH:MM" format (UTC)
 * @returns Time in "HH:MM" format (local timezone)
 */
export function utcToLocalTime(utcTimeStr: string): string {
  const [hours, minutes] = utcTimeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
