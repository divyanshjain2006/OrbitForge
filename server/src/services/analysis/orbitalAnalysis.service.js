import { calculateMissionRisk } from "../risk.service.js";

const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_PER_S2 = 398600.4418;
const MODEL_VERSION = "1.1.0";

export function calculateOrbitalAnalysis(mission) {
  const altitudeKm = Number(mission.altitude);
  const inclinationDeg = Number(mission.inclination);
  const durationDays = Number(mission.duration);

  if (
    !Number.isFinite(altitudeKm) ||
    !Number.isFinite(inclinationDeg) ||
    !Number.isFinite(durationDays)
  ) {
    throw new Error("Invalid mission parameters");
  }

  if (altitudeKm < 100 || altitudeKm > 2000) {
    throw new Error("Orbital altitude must be between 100 km and 2000 km");
  }

  if (inclinationDeg < 0 || inclinationDeg > 180) {
    throw new Error(
      "Orbital inclination must be between 0 and 180 degrees"
    );
  }

  if (durationDays < 1 || durationDays > 3650) {
    throw new Error("Mission duration must be between 1 and 3650 days");
  }

  const orbitalRadiusKm =
    EARTH_RADIUS_KM + altitudeKm;

  const orbitalVelocityKmPerSecond = Math.sqrt(
    EARTH_MU_KM3_PER_S2 / orbitalRadiusKm
  );

  const orbitalPeriodSeconds =
    2 *
    Math.PI *
    Math.sqrt(
      Math.pow(orbitalRadiusKm, 3) /
        EARTH_MU_KM3_PER_S2
    );

  const orbitalPeriodMinutes =
    orbitalPeriodSeconds / 60;

  const revolutionsPerDay =
    86400 / orbitalPeriodSeconds;

  const estimatedRevolutions =
    revolutionsPerDay * durationDays;

  // OrbitGuard uses one centralized risk engine.
  const risk = calculateMissionRisk(mission);

  return {
    mission: {
      id: mission._id,
      name: mission.name
    },

    inputs: {
      altitudeKm,
      inclinationDeg,
      durationDays
    },

    orbitalRadiusKm: round(
      orbitalRadiusKm,
      3
    ),

    orbitalVelocityKmPerSecond: round(
      orbitalVelocityKmPerSecond,
      4
    ),

    orbitalPeriodMinutes: round(
      orbitalPeriodMinutes,
      3
    ),

    revolutionsPerDay: round(
      revolutionsPerDay,
      3
    ),

    estimatedRevolutions: Math.round(
      estimatedRevolutions
    ),

    methodology: {
      type: "deterministic-circular-two-body-estimate",
      version: MODEL_VERSION,
      provenance: "MODELED",
      assumptions: [
        "Circular orbit (eccentricity = 0)",
        "Two-body central gravity only",
        "Fixed Earth radius and gravitational parameter"
      ],
      limitations: [
        "No state-vector propagation or ephemeris",
        "No perturbations, drag integration, maneuvers, or uncertainty model"
      ]
    },

    risk
  };
}

function round(value, decimals) {
  const multiplier = 10 ** decimals;

  return (
    Math.round(value * multiplier) /
    multiplier
  );
}
