export const SPACE_WEATHER_MODEL_VERSION = "1.0.0";

/**
 * OrbitForge Space Weather Model
 * 
 * Version: 1.0.0
 * 
 * Inputs:
 * - cmeEvents: Array of validated DONKI CME Event objects containing speed and halfAngle.
 * 
 * Methodology:
 * - Calculates a deterministic hazard index based on the maximum CME speed and width (halfAngle) 
 *   observed within the provided dataset version.
 * - Formula: index = (max_speed / 1000) * (max_halfAngle / 90). The index is clamped to [0.0, 1.0].
 * 
 * Thresholds:
 * - index < 0.3: LOW
 * - index < 0.7: MODERATE
 * - index >= 0.7: HIGH
 * 
 * Assumptions:
 * - Higher speeds and wider angles correlate to higher operational hazard in LEO.
 * - The DONKI "isMostAccurate" analysis (or latest) represents the true physical parameters.
 * - CME type (e.g. S, C, O, R, ER) is implicitly represented by speed, therefore type is NOT double-counted.
 * 
 * Limitations:
 * - This is an ORBITFORGE DETERMINISTIC MODEL DERIVED FROM VALIDATED NASA DONKI DATA.
 * - It is NOT an official NASA risk rating.
 * - It is NOT a live impact prediction or arrival prediction.
 */

export function calculateSpaceWeatherIndex(cmeEvents = []) {
  if (!Array.isArray(cmeEvents) || cmeEvents.length === 0) {
    return {
      spaceWeatherIndex: 0.0,
      spaceWeatherLevel: "LOW",
      contributingFactors: ["No active CME events provided."],
      methodology: "OrbitForge Space Weather Model 1.0.0",
      assumptions: "Higher speeds/angles = higher hazard. Type is not double-counted.",
      limitations: "Modeled hazard based on static data. Not a live impact prediction."
    };
  }

  let maxSpeed = 0;
  let maxHalfAngle = 0;
  let activeEventCount = 0;

  for (const event of cmeEvents) {
    if (event.speed != null) {
      maxSpeed = Math.max(maxSpeed, event.speed);
      activeEventCount++;
    }
    if (event.halfAngle != null) {
      maxHalfAngle = Math.max(maxHalfAngle, event.halfAngle);
    }
  }

  // Cap max values for normalization
  const normSpeed = Math.min(maxSpeed, 3000) / 1000; // Expected speeds 0-3000 km/s
  const normAngle = Math.min(maxHalfAngle, 180) / 90; // Expected half angles 0-180 deg

  let index = (normSpeed * normAngle);
  // Clamp
  if (index > 1.0) index = 1.0;
  if (index < 0.0) index = 0.0;
  if (isNaN(index)) index = 0.0;

  let level = "LOW";
  if (index >= 0.7) {
    level = "HIGH";
  } else if (index >= 0.3) {
    level = "MODERATE";
  }

  return {
    spaceWeatherIndex: Number(index.toFixed(3)),
    spaceWeatherLevel: level,
    contributingFactors: [
      `Evaluated ${activeEventCount} CME events with valid parameters.`,
      `Maximum observed speed: ${maxSpeed} km/s.`,
      `Maximum observed half-angle: ${maxHalfAngle}°.`
    ],
    methodology: "OrbitForge Space Weather Model 1.0.0",
    assumptions: "Higher speeds/angles = higher hazard. Type is not double-counted.",
    limitations: "Modeled hazard based on static data. Not a live impact prediction."
  };
}
