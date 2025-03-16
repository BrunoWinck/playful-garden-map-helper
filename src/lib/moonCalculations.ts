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

// Helper functions to convert between degrees and radians.
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
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
 * Compute the Moon's altitude (in degrees) for a given date and observer location.
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
 * The function samples the Moon's altitude every few minutes during the day and
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

/**
 * Finds the highest altitude of the Moon for a given day and location.
 * It samples the Moon's altitude at regular intervals and returns the highest value.
 * 
 * @param date - The date for which to compute the highest Moon altitude.
 * @param latitude - Observer's latitude in degrees.
 * @param longitude - Observer's longitude in degrees.
 * @returns An object containing the highest altitude and the time it occurs.
 */
export function getHighestMoonAltitude(date: Date, latitude: number, longitude: number): { altitude: number; time: Date } {
  // Create a date object for the start of the day in UTC
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  
  // Sample interval in minutes
  const sampleIntervalMinutes = 15;
  let highestAltitude = -90; // Start below the horizon
  let timeOfHighestAltitude = new Date(startOfDay);
  
  // Sample the Moon's altitude throughout the day
  for (let minutes = 0; minutes < 24 * 60; minutes += sampleIntervalMinutes) {
    const sampleTime = new Date(startOfDay.getTime() + minutes * 60000);
    const altitude = getMoonAltitude(sampleTime, latitude, longitude);
    
    if (altitude > highestAltitude) {
      highestAltitude = altitude;
      timeOfHighestAltitude = new Date(sampleTime);
    }
  }
  
  return {
    altitude: Math.round(highestAltitude * 10) / 10, // Round to 1 decimal place
    time: timeOfHighestAltitude
  };
}
