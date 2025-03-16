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

function getJulianDate2(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function solarPosition(latitude: number, longitude: number, date: Date) {
  const jd = getJulianDate(date);
  const n = jd - 2451545.0; // Days since J2000.0
  const L = (280.46 + 0.9856474 * n) % 360; // Mean longitude
  const g = toRadians((357.528 + 0.9856003 * n) % 360); // Mean anomaly
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)); // Ecliptic longitude
  const epsilon = toRadians(23.439 - 0.0000004 * n); // Obliquity of the ecliptic
  const declination = toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));

  const timeOffset = 4 * longitude; // Time correction (in minutes)
  const solarNoon = 12 - timeOffset / 60;
  const hourAngle = 15 * (date.getUTCHours() + date.getUTCMinutes() / 60 - solarNoon);

  const elevation = toDegrees(
    Math.asin(
      Math.sin(toRadians(latitude)) * Math.sin(toRadians(declination)) +
        Math.cos(toRadians(latitude)) *
          Math.cos(toRadians(declination)) *
          Math.cos(toRadians(hourAngle))
    )
  );

  const azimuth = toDegrees(
    Math.atan2(
      -Math.sin(toRadians(hourAngle)),
      Math.tan(toRadians(declination)) * Math.cos(toRadians(latitude)) -
        Math.sin(toRadians(latitude)) * Math.cos(toRadians(hourAngle))
    )
  );

  return { elevation, azimuth };
}

function solarRadiation(elevation: number): number {
  const I0 = 1361; // Solar constant in W/m²
  return I0 * Math.max(0, Math.sin(toRadians(elevation)));
}

function computeDaylight(latitude: number, longitude: number, dayOfYear: number) {
  const declination = solarDeclination(dayOfYear);
  const ha = hourAngle(latitude, declination);
  const noonUTC = solarNoon(longitude);

  return {
    sunrise: formatTime(noonUTC - ha / 15),
    sunset: formatTime(noonUTC + ha / 15),
    civilTwilightStart: formatTime(noonUTC - (ha + 6) / 15),
    civilTwilightEnd: formatTime(noonUTC + (ha + 6) / 15),
  };
}

function windChill(temperature: number, windSpeed: number): number {
  return windSpeed > 3
    ? 35.74 +
        0.6215 * temperature -
        35.75 * windSpeed ** 0.16 +
        0.4275 * temperature * windSpeed ** 0.16
    : temperature;
}

function dewPoint(temperature: number, humidity: number): number {
  const a = 17.27, b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

function frostPoint(temperature: number, humidity: number): number {
  return dewPoint(temperature, humidity) - 2;
}

function liftingCondensationLevel(temperature: number, dewPoint: number): number {
  return (temperature - dewPoint) * 125; // Approx. meters per °C
}

function example()
{
  const latitude = 40.7128; // Example: New York City
  const longitude = -74.0060;
  const date = new Date();
  
  const { elevation, azimuth } = solarPosition(latitude, longitude, date);
  const radiation = solarRadiation(elevation);
  const { sunrise, sunset, civilTwilightStart, civilTwilightEnd } = computeDaylight(40.7128, -74.0060, 80);
  const heat = getHeatIndex(30, 70);
  const chill = windChill(5, 20);
  const dew = dewPoint(15, 80);
  const frost = frostPoint(15, 80);
  const lcl = liftingCondensationLevel(15, dew);
  
  console.log(`🌞 Sun Elevation: ${elevation.toFixed(2)}°, Azimuth: ${azimuth.toFixed(2)}°`);
  console.log(`☀️ Solar Radiation: ${radiation.toFixed(2)} W/m²`);
  console.log(`🌅 Sunrise: ${sunrise} UTC, Sunset: ${sunset} UTC`);
  console.log(`❄️ Frost Point: ${frost.toFixed(2)}°C`);
  console.log(`🌫️ LCL (Cloud Base Altitude): ${lcl.toFixed(2)}m`);
}

// Existing methods from previous fix/implementation 
function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Calculate solar elevation and azimuth angles
 * @param {number} latitude - GPS latitude in degrees
 * @param {number} longitude - GPS longitude in degrees
 * @param {Date} date - Date object (UTC time assumed)
 * @returns {{ elevation: number, azimuth: number }}
 */
export function getSolarPosition(latitude: number, longitude: number, date: Date) {
  const daysSinceJan1 = (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000;
  const declination = 23.44 * Math.cos(((360 / 365) * (daysSinceJan1 + 10)) * Math.PI / 180);
  const timeOffset = (date.getUTCHours() + date.getUTCMinutes() / 60) - longitude / 15;
  const hourAngle = (timeOffset - 12) * 15;
  
  const latRad = latitude * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  const haRad = hourAngle * Math.PI / 180;
  
  const elevation = Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)) * 180 / Math.PI;
  const azimuth = Math.atan2(
      -Math.sin(haRad),
      Math.cos(latRad) * Math.tan(decRad) - Math.sin(latRad) * Math.cos(haRad)
  ) * 180 / Math.PI;

  return { elevation, azimuth };
}

/**
 * Calculate frost point temperature
 * @param {number} temperature - Air temperature in Celsius
 * @param {number} humidity - Relative humidity in % (0-100)
 * @returns {number} Frost point in Celsius
 */
export function getFrostPoint(temperature: number, humidity: number) {
  const dewPoint = temperature - ((100 - humidity) / 5);
  return dewPoint - 1; // Approximate frost point (1°C below dew point)
}

// Heat index calculation
export function getHeatIndex(temperatureC: number, humidity: number): number {
  const temperatureF = temperatureC * (9 / 5) + 32;
  const hiF =
    -42.379 +
    2.04901523 * temperatureF +
    10.14333127 * humidity -
    0.22475541 * temperatureF * humidity -
    6.83783e-3 * temperatureF * temperatureF -
    5.481717e-2 * humidity * humidity +
    1.22874e-3 * temperatureF * temperatureF * humidity +
    8.5282e-4 * temperatureF * humidity * humidity -
    1.99e-6 * temperatureF * temperatureF * humidity * humidity;
  const hiC = (hiF - 32) * (5 / 9);
  return hiC;
}
