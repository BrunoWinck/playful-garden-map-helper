
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
  const heat = heatIndex(30, 70);
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

/* previous respnse
import { sin, cos, tan, acos, asin, atan2, PI } from "mathjs";

// Constants
const DEG_TO_RAD = PI / 180;
const RAD_TO_DEG = 180 / PI;

/**
 * Calculate solar elevation and azimuth angles
 * @param {number} latitude - GPS latitude in degrees
 * @param {number} longitude - GPS longitude in degrees
 * @param {Date} date - Date object (UTC time assumed)
 * @returns {{ elevation: number, azimuth: number }}
 * /
export function getSolarPosition(latitude: number, longitude: number, date: Date) {
  const daysSinceJan1 = (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000;
  const declination = 23.44 * cos(((360 / 365) * (daysSinceJan1 + 10)) * DEG_TO_RAD);
  const timeOffset = (date.getUTCHours() + date.getUTCMinutes() / 60) - longitude / 15;
  const hourAngle = (timeOffset - 12) * 15;
  
  const latRad = latitude * DEG_TO_RAD;
  const decRad = declination * DEG_TO_RAD;
  const haRad = hourAngle * DEG_TO_RAD;
  
  const elevation = asin(sin(latRad) * sin(decRad) + cos(latRad) * cos(decRad) * cos(haRad)) * RAD_TO_DEG;
  const azimuth = atan2(
      -sin(haRad),
      cos(latRad) * tan(decRad) - sin(latRad) * cos(haRad)
  ) * RAD_TO_DEG;

  return { elevation, azimuth };
}

/**
* Calculate frost point temperature
* @param {number} temperature - Air temperature in Celsius
* @param {number} humidity - Relative humidity in % (0-100)
* @returns {number} Frost point in Celsius
* /
export function getFrostPoint(temperature: number, humidity: number) {
  const dewPoint = temperature - ((100 - humidity) / 5);
  return dewPoint - 1; // Approximate frost point (1°C below dew point)
}
*/

// meteorology.ts

// Helper functions to convert between degrees and radians.
function toRadians3(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees3(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 1. Solar Position Calculation
 * Calculates the sun's elevation and azimuth (in degrees) for a given UTC Date, latitude, and longitude.
 */
export function getSolarPosition(latitude: number, longitude: number, date: Date): { elevation: number; azimuth: number } {
  // Convert latitude to radians.
  const radLat = toRadians(latitude);

  // Calculate the day of the year.
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Get fractional hour (UTC)
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Fractional year (gamma) in radians.
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);

  // Equation of Time (in minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination (in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes (adjusted for longitude; here we assume UTC so no timezone correction)
  const timeOffset = eqTime + 4 * longitude;

  // True Solar Time in minutes.
  const tst = hour * 60 + timeOffset;

  // Hour angle (in degrees).
  const ha = tst / 4 - 180;
  const haRad = toRadians(ha);

  // Solar zenith angle.
  const zenith = Math.acos(Math.sin(radLat) * Math.sin(decl) + Math.cos(radLat) * Math.cos(decl) * Math.cos(haRad));

  // Solar elevation angle (in degrees).
  const elevation = 90 - toDegrees(zenith);

  // Azimuth calculation.
  let azimuth = toDegrees(
    Math.acos((Math.sin(radLat) * Math.cos(zenith) - Math.sin(decl)) / (Math.cos(radLat) * Math.sin(zenith)))
  );
  // Adjust azimuth depending on the hour angle.
  if (ha > 0) {
    azimuth = 360 - azimuth;
  }

  return { elevation, azimuth };
}

/**
 * 2. Solar Radiation (Insolation)
 * A simplified model: returns the incident solar radiation (W/m²) based on the solar elevation.
 */
export function getSolarRadiation(elevation: number): number {
  if (elevation <= 0) {
    return 0;
  }
  const solarConstant = 1361; // in W/m²
  return solarConstant * Math.sin(toRadians(elevation));
}

/**
 * 3. Heat Index (Feels-Like Temperature)
 * Uses the NOAA formula. Input temperature is in Celsius and humidity in percent.
 * The calculation converts to Fahrenheit and back.
 */
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

/**
 * 4. Wind Chill Calculation
 * Uses the Canadian wind chill formula.
 * Temperature in Celsius and windSpeed in km/h.
 */
export function getWindChill(temperatureC: number, windSpeedKmh: number): number {
  // Wind chill is only significant for wind speeds above ~4.8 km/h.
  if (windSpeedKmh < 4.8) {
    return temperatureC;
  }
  return 13.12 + 0.6215 * temperatureC - 11.37 * Math.pow(windSpeedKmh, 0.16) + 0.3965 * temperatureC * Math.pow(windSpeedKmh, 0.16);
}

/**
 * 5. Dew Point Calculation using the Magnus Formula
 * Temperature is in Celsius and relative humidity in percent.
 */
export function getDewPoint(temperatureC: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = Math.log(humidity / 100) + (a * temperatureC) / (b + temperatureC);
  return (b * alpha) / (a - alpha);
}

/**
 * 6. Frost Point Estimation
 * A rough approximation, subtracting about 2°C from the dew point under conditions
 * where frost is likely to form.
 */
export function getFrostPoint(temperatureC: number, humidity: number): number {
  const dewPoint = getDewPoint(temperatureC, humidity);
  return dewPoint - 2;
}

/**
 * 7. Lifting Condensation Level (LCL)
 * An approximate calculation (in meters) of the height at which air becomes saturated.
 * LCL ≈ 125 * (temperature - dewPoint)
 */
export function getLCL(temperatureC: number, humidity: number): number {
  const dewPoint = getDewPoint(temperatureC, humidity);
  return 125 * (temperatureC - dewPoint);
}

/**
 * 8. Sunrise, Sunset, and Twilight Times Calculation
 * A helper that calculates sunrise and sunset times for a given solar altitude (in degrees).
 * For standard sunrise/sunset, use altitude = -0.833 (accounts for atmospheric refraction and solar disk).
 */
function getSunriseSunsetForAltitude(
  altitude: number,
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: Date; sunset: Date } | null {
  const altRad = toRadians(altitude);
  const latRad = toRadians(latitude);

  // Calculate day of year.
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Fractional year (gamma) in radians.
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

  // Solar declination (in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Calculate the hour angle for the given altitude.
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));

  if (cosH < -1 || cosH > 1) {
    // The sun does not reach this altitude on this day (e.g., during polar night/day).
    return null;
  }

  const H = Math.acos(cosH); // in radians

  // Equation of Time (in minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar noon (in minutes from midnight UTC).
  const solarNoonMinutes = 720 - 4 * longitude - eqTime;

  // Convert hour angle to minutes (each degree corresponds to 4 minutes).
  const deltaMinutes = toDegrees(H) * 4;

  // Sunrise and sunset times in minutes from midnight UTC.
  const sunriseMinutes = solarNoonMinutes - deltaMinutes;
  const sunsetMinutes = solarNoonMinutes + deltaMinutes;

  // Construct Date objects for sunrise and sunset.
  const sunrise = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  sunrise.setUTCMinutes(sunriseMinutes);
  const sunset = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  sunset.setUTCMinutes(sunsetMinutes);

  return { sunrise, sunset };
}

/**
 * 9. Day Length and Twilight Times
 * Returns an object containing:
 * - Standard sunrise/sunset (altitude = -0.833°)
 * - Civil twilight (altitude = -6°)
 * - Nautical twilight (altitude = -12°)
 * - Astronomical twilight (altitude = -18°)
 */
export function getDayLengthAndTwilight(
  date: Date,
  latitude: number,
  longitude: number
): {
  sunrise: Date | null;
  sunset: Date | null;
  dayLengthMinutes: number | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
} {
  const sunTimes = getSunriseSunsetForAltitude(-0.833, date, latitude, longitude);
  let dayLengthMinutes: number | null = null;
  if (sunTimes) {
    dayLengthMinutes = (sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / 60000;
  }

  const civil = getSunriseSunsetForAltitude(-6, date, latitude, longitude);
  const nautical = getSunriseSunsetForAltitude(-12, date, latitude, longitude);
  const astronomical = getSunriseSunsetForAltitude(-18, date, latitude, longitude);

  return {
    sunrise: sunTimes ? sunTimes.sunrise : null,
    sunset: sunTimes ? sunTimes.sunset : null,
    dayLengthMinutes,
    civilDawn: civil ? civil.sunrise : null,
    civilDusk: civil ? civil.sunset : null,
    nauticalDawn: nautical ? nautical.sunrise : null,
    nauticalDusk: nautical ? nautical.sunset : null,
    astronomicalDawn: astronomical ? astronomical.sunrise : null,
    astronomicalDusk: astronomical ? astronomical.sunset : null,
  };
}
/*
const now = new Date();
const { elevation, azimuth } = getSolarPosition(40.7128, -74.0060, now);
console.log(`Sun Elevation: ${elevation.toFixed(2)}°, Azimuth: ${azimuth.toFixed(2)}°`);
*/

// Moon

/**
 * Computes the Moon's phase for a given date.
 * The phase is calculated as the age (in days) since the last New Moon,
 * along with a fractional phase, approximate illumination, and a phase name.
 * 
 * @param date - The date for which to compute the Moon phase.
 * @param latitude - Observer's latitude (unused in this calculation).
 * @param longitude - Observer's longitude (unused in this calculation).
 * @returns An object containing:
 *   - age: number (days since new moon)
 *   - phaseFraction: number (fraction of the lunar cycle, 0 to 1)
 *   - illumination: number (approximate fraction of the Moon illuminated, 0 to 1)
 *   - phaseName: string (e.g., "New Moon", "Waxing Crescent", etc.)
 */
export function getMoonPhase(date: Date, latitude: number, longitude: number) {
  // Convert the given date to a Julian Date (JD)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getUTCDate();

  let Y = year;
  let M = month;
  if (M < 3) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) +
             Math.floor(30.6001 * (M + 1)) +
             day + B - 1524.5;

  // Known new moon reference: January 6, 2000 18:14 UT (Julian Date ~2451550.1)
  const knownNewMoonJD = 2451550.1;
  const lunarCycle = 29.53058867; // Average length of the lunar cycle in days

  // Calculate the moon's age in days (days since new moon)
  let age = (JD - knownNewMoonJD) % lunarCycle;
  if (age < 0) {
    age += lunarCycle;
  }

  // Fractional phase (0.0 = New Moon, 0.5 = Full Moon, etc.)
  const phaseFraction = age / lunarCycle;

  // Approximate illumination of the Moon (using a cosine function)
  const illumination = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;

  // Determine the phase name based on the age (in days)
  let phaseName: string;
  if (age < 1.84566) {
    phaseName = "New Moon";
  } else if (age < 5.53699) {
    phaseName = "Waxing Crescent";
  } else if (age < 9.22831) {
    phaseName = "First Quarter";
  } else if (age < 12.91963) {
    phaseName = "Waxing Gibbous";
  } else if (age < 16.61096) {
    phaseName = "Full Moon";
  } else if (age < 20.30228) {
    phaseName = "Waning Gibbous";
  } else if (age < 23.99361) {
    phaseName = "Last Quarter";
  } else if (age < 27.68493) {
    phaseName = "Waning Crescent";
  } else {
    phaseName = "New Moon";
  }

  return {
    age,           // Age of the Moon in days since the last New Moon
    phaseFraction, // Fraction of the lunar cycle completed (0 to 1)
    illumination,  // Approximate fraction of the Moon illuminated (0 to 1)
    phaseName      // Name of the Moon phase
  };
}

/*
// Example usage:
const date = new Date(); // current date and time
const latitude = 40.7128; // Example: New York City latitude
const longitude = -74.0060; // Example: New York City longitude

const moonPhaseInfo = getMoonPhase(date, latitude, longitude);
console.log(`Moon Age: ${moonPhaseInfo.age.toFixed(2)} days`);
console.log(`Phase Fraction: ${(moonPhaseInfo.phaseFraction * 100).toFixed(1)}%`);
console.log(`Illumination: ${(moonPhaseInfo.illumination * 100).toFixed(1)}%`);
console.log(`Phase: ${moonPhaseInfo.phaseName}`);
*/
// moonTimes.ts

// Helper functions to convert between degrees and radians.
function toRadians4(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees4(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Compute the Julian Date for a given UTC Date.
 */
function getJulianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JS months are 0-indexed.
  const day =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  let Y = year;
  let M = month;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day +
    B -
    1524.5;
  return JD;
}

/**
 * Compute the Moon’s altitude (in degrees) for a given date and observer location.
 * This uses a simplified lunar position algorithm.
 */
function getMoonAltitude(date: Date, latitude: number, longitude: number): number {
  // Days since J2000.0
  const JD = getJulianDate(date);
  const D = JD - 2451545.0;

  // Simplified lunar position parameters (in degrees)
  const L = (218.316 + 13.176396 * D) % 360;          // Moon's mean longitude
  const M_moon = (134.963 + 13.064993 * D) % 360;       // Moon's mean anomaly
  const F = (93.272 + 13.229350 * D) % 360;             // Moon's mean elongation

  // Convert angles to radians.
  const L_rad = toRadians(L);
  const M_moon_rad = toRadians(M_moon);
  const F_rad = toRadians(F);

  // Ecliptic longitude with a simple correction (radians).
  const lambda = L_rad + toRadians(6.289) * Math.sin(M_moon_rad);
  // Ecliptic latitude (radians, approximate).
  const beta = toRadians(5.128) * Math.sin(F_rad);

  // Obliquity of the ecliptic (approximate).
  const epsilon = toRadians(23.4397);

  // Convert ecliptic coordinates to equatorial coordinates.
  const sinDec = Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec);

  // Right Ascension.
  let RA = Math.atan2(
    Math.sin(lambda) * Math.cos(epsilon) - Math.tan(beta) * Math.sin(epsilon),
    Math.cos(lambda)
  );
  if (RA < 0) {
    RA += 2 * Math.PI;
  }

  // Compute Greenwich Mean Sidereal Time (GMST) in radians.
  const GMST = toRadians((280.46061837 + 360.98564736629 * (JD - 2451545.0)) % 360);
  // Local Sidereal Time (radians).
  const LST = GMST + toRadians(longitude);

  // Hour Angle (radians).
  let HA = LST - RA;
  // Normalize HA between -π and +π.
  if (HA < -Math.PI) HA += 2 * Math.PI;
  if (HA > Math.PI) HA -= 2 * Math.PI;

  const latRad = toRadians(latitude);
  // Calculate the altitude of the Moon.
  const altitude = Math.asin(
    Math.sin(latRad) * Math.sin(dec) +
    Math.cos(latRad) * Math.cos(dec) * Math.cos(HA)
  );
  return toDegrees(altitude);
}

/**
 * Find the time when the Moon's altitude crosses the horizon between start and end.
 * Uses a binary search for a crossing (within ~1 minute tolerance).
 * @param start Date object representing the start of the search interval.
 * @param end Date object representing the end of the search interval.
 * @param latitude Observer's latitude.
 * @param longitude Observer's longitude.
 * @param isRising True for moonrise (altitude crossing from negative to positive),
 *                 false for moonset (positive to negative).
 */
function findMoonCrossing(start: Date, end: Date, latitude: number, longitude: number, isRising: boolean): Date {
  const tolerance = 60 * 1000; // 1 minute in milliseconds
  let t1 = start.getTime();
  let t2 = end.getTime();
  let mid: number;
  while (t2 - t1 > tolerance) {
    mid = (t1 + t2) / 2;
    const midDate = new Date(mid);
    const altitude = getMoonAltitude(midDate, latitude, longitude);
    if (isRising) {
      // For rising, search for the time when altitude goes from below 0 to above 0.
      if (altitude < 0) {
        t1 = mid;
      } else {
        t2 = mid;
      }
    } else {
      // For setting, search for the time when altitude goes from above 0 to below 0.
      if (altitude > 0) {
        t1 = mid;
      } else {
        t2 = mid;
      }
    }
  }
  return new Date((t1 + t2) / 2);
}

/**
 * Compute the moonrise and moonset times (UTC) for a given date and observer location.
 * The function samples the Moon’s altitude every few minutes during the day and
 * uses a binary search to refine the times of horizon crossing.
 * @param date A Date object (UTC) for which the calculations are done.
 * @param latitude Observer's latitude in degrees.
 * @param longitude Observer's longitude in degrees.
 * @returns An object with `moonrise` and `moonset` as Date objects (or null if not found).
 */
export function getMoonriseMoonset(date: Date, latitude: number, longitude: number): { moonrise: Date | null; moonset: Date | null } {
  // Create Date objects for the start and end of the day (UTC).
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59));

  const sampleIntervalMinutes = 5; // sampling interval
  let prevTime = startOfDay.getTime();
  let prevAltitude = getMoonAltitude(startOfDay, latitude, longitude);

  let moonrise: Date | null = null;
  let moonset: Date | null = null;

  // Sample the Moon's altitude throughout the day.
  for (let t = startOfDay.getTime() + sampleIntervalMinutes * 60000; t <= endOfDay.getTime(); t += sampleIntervalMinutes * 60000) {
    const currentDate = new Date(t);
    const currentAltitude = getMoonAltitude(currentDate, latitude, longitude);

    // Detect a moonrise (altitude crossing from below 0 to above 0).
    if (!moonrise && prevAltitude < 0 && currentAltitude >= 0) {
      moonrise = findMoonCrossing(new Date(prevTime), currentDate, latitude, longitude, true);
    }
    // Detect a moonset (altitude crossing from above 0 to below 0).
    if (!moonset && prevAltitude >= 0 && currentAltitude < 0) {
      moonset = findMoonCrossing(new Date(prevTime), currentDate, latitude, longitude, false);
    }

    prevAltitude = currentAltitude;
    prevTime = t;
  }

  return { moonrise, moonset };
}

/*
// Example usage:
const date = new Date(); // current UTC date and time
const latitude = 40.7128; // Example: New York City
const longitude = -74.0060;

const { moonrise, moonset } = getMoonriseMoonset(date, latitude, longitude);
if (moonrise) {
  console.log("Moonrise (UTC):", moonrise.toUTCString());
} else {
  console.log("Moonrise not found for this date/location.");
}
if (moonset) {
  console.log("Moonset (UTC):", moonset.toUTCString());
} else {
  console.log("Moonset not found for this date/location.");
}
  */
