
export type SunlightData = {
  uvIndexPeak: number; // Maximum UV Index at solar noon
  daylightHours: number; // Total hours of daylight
  ppfd: number; // Photosynthetic Photon Flux Density (µmol/m²/s)
};

/**
 * Approximates the UV irradiance curve over the day using a Gaussian distribution.
 * @param t - Time in hours (relative to solar noon)
 * @param peakUvIndex - Maximum UV index at solar noon
 * @returns Estimated UV index at time t
 */
export function uvIntensityAtTime(t: number, peakUvIndex: number): number {
  const SIGMA = 0.3 * peakUvIndex; // Standard deviation controls spread
  return peakUvIndex * Math.exp(-((t * t) / (2 * SIGMA * SIGMA)));
}

/**
 * Integrates the UV exposure over the entire daylight period.
 * @param peakUvIndex - Maximum UV index at solar noon
 * @param daylightHours - Total hours of daylight
 * @returns UV dose in J/m²
 */
export function calculateUvDose(peakUvIndex: number, daylightHours: number): number {
  const UV_IRRADIANCE_FACTOR = 0.025; // Conversion factor from UV index to W/m²
  const SECONDS_PER_HOUR = 3600;
  const STEP_SIZE = 0.1; // Integration step in hours
  let totalUvDose = 0;

  const halfDay = daylightHours / 2;
  for (let t = -halfDay; t <= halfDay; t += STEP_SIZE) {
    const uvIndexAtT = uvIntensityAtTime(t, peakUvIndex);
    const uvIrradiance = UV_IRRADIANCE_FACTOR * uvIndexAtT;
    totalUvDose += uvIrradiance * (STEP_SIZE * SECONDS_PER_HOUR);
  }

  return totalUvDose;
}

/**
 * Calculates the Daily Light Integral (DLI) in mol/m²/day.
 * @param ppfd - Photosynthetic Photon Flux Density (µmol/m²/s)
 * @param daylightHours - The number of daylight hours
 * @returns DLI in moles per square meter per day (mol/m²/day)
 */
export function calculateDli(ppfd: number, daylightHours: number): number {
  const SECONDS_PER_HOUR = 3600;
  const MICROMOL_TO_MOL = 1_000_000; // Conversion from µmol to mol

  const dli = (ppfd * SECONDS_PER_HOUR * daylightHours) / MICROMOL_TO_MOL;
  return dli;
}

/**
 * Computes both UV Dose and DLI given sunlight conditions.
 * @param data - Object containing UV index, daylight hours, and PPFD
 * @returns Object with UV Dose (J/m²) and DLI (mol/m²/day)
 */
export function computeSunlightExposure(data: SunlightData) {
  return {
    uvDose: calculateUvDose(data.uvIndexPeak, data.daylightHours),
    dli: calculateDli(data.ppfd, data.daylightHours),
  };
}

/*
// Example Usage
const sunlightConditions: SunlightData = {
  uvIndexPeak: 8, // Peak UV Index at noon
  daylightHours: 10, // 10 hours of daylight
  ppfd: 500, // 500 µmol/m²/s (Average PPFD)
};

const result = computeSunlightExposure(sunlightConditions);
console.log(`UV Dose: ${result.uvDose.toFixed(2)} J/m²`);
console.log(`DLI: ${result.dli.toFixed(2)} mol/m²/day`);
*/
