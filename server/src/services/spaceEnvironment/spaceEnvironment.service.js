const MODEL_VERSION = "1.0.0";

function getDragExposure(altitude) {
  if (altitude < 250) {
    return {
      level: "VERY_HIGH",
      score: 30,
      title: "Very high atmospheric-drag exposure",
      explanation:
        "Very low LEO altitude substantially increases atmospheric-drag exposure and can accelerate orbital decay.",
      signal: "VERY_HIGH_DRAG"
    };
  }

  if (altitude < 300) {
    return {
      level: "HIGH",
      score: 24,
      title: "High atmospheric-drag exposure",
      explanation:
        "Lower LEO altitude increases atmospheric density exposure and can increase orbital-decay and station-keeping requirements.",
      signal: "HIGH_DRAG"
    };
  }

  if (altitude < 450) {
    return {
      level: "MODERATE",
      score: 14,
      title: "Moderate atmospheric-drag exposure",
      explanation:
        "The selected altitude remains sufficiently low for atmospheric drag to be an important mission-environment consideration.",
      signal: "MODERATE_DRAG"
    };
  }

  if (altitude <= 800) {
    return {
      level: "LOW",
      score: 0,
      title: "Low modeled drag exposure",
      explanation:
        "The selected altitude is within a commonly used LEO range where atmospheric-drag exposure is comparatively manageable.",
      signal: "NOMINAL_DRAG"
    };
  }

  return {
    level: "LOW",
    score: 3,
    title: "Low atmospheric-drag exposure",
    explanation:
      "Higher altitude generally reduces atmospheric-drag exposure, although other mission-environment considerations remain relevant.",
    signal: "LOW_DRAG"
  };
}

function getRadiationExposure(inclination, altitude) {
  let score = 0;

  if (altitude > 800) {
    score += 6;
  }

  if (inclination > 90) {
    score += 5;
  }

  if (score >= 10) {
    return {
      level: "ELEVATED",
      score,
      title: "Elevated modeled radiation exposure",
      explanation:
        "The selected orbital geometry may increase exposure to the space radiation environment compared with lower-altitude, lower-inclination configurations.",
      signal: "ELEVATED_RADIATION_CONTEXT"
    };
  }

  if (score > 0) {
    return {
      level: "MODERATE",
      score,
      title: "Moderate modeled radiation exposure",
      explanation:
        "Orbital altitude and inclination introduce additional radiation-environment considerations that should be evaluated during mission planning.",
      signal: "MODERATE_RADIATION_CONTEXT"
    };
  }

  return {
    level: "LOW",
    score: 0,
    title: "Nominal modeled radiation exposure",
    explanation:
      "The current orbital configuration does not trigger an elevated radiation-environment signal in the OrbitGuard model.",
    signal: "NOMINAL_RADIATION_CONTEXT"
  };
}

function getEnvironmentPosture(score) {
  if (score >= 25) {
    return {
      status: "ELEVATED_ENVIRONMENTAL_ATTENTION",
      label: "Elevated environmental attention"
    };
  }

  if (score >= 10) {
    return {
      status: "MONITOR_ENVIRONMENT",
      label: "Monitor environment"
    };
  }

  return {
    status: "BASELINE",
    label: "Baseline environment"
  };
}

export function assessSpaceEnvironment(mission) {
  const altitude = Number(mission.altitude);
  const inclination = Number(mission.inclination);

  if (
    !Number.isFinite(altitude) ||
    !Number.isFinite(inclination)
  ) {
    throw new Error(
      "Invalid orbital parameters for environmental assessment."
    );
  }

  if (altitude < 100 || altitude > 2000 || inclination < 0 || inclination > 180) {
    throw new Error("Orbital parameters are outside OrbitGuard's supported LEO configuration domain.");
  }

  const drag = getDragExposure(altitude);

  const radiation = getRadiationExposure(
    inclination,
    altitude
  );

  const factors = [
    {
      category: "ATMOSPHERIC_DRAG",
      ...drag
    },
    {
      category: "RADIATION",
      ...radiation
    }
  ];

  const activeFactors = factors.filter(
    (factor) => factor.score > 0
  );

  const score = Math.min(
    activeFactors.reduce(
      (total, factor) => total + factor.score,
      0
    ),
    100
  );

  return {
    score,
    level:
      score >= 25
        ? "ELEVATED"
        : score >= 10
          ? "MODERATE"
          : "LOW",

    posture: getEnvironmentPosture(score),

    factors,

    activeFactors,

    methodology: {
      type: "modeled-environmental-assessment",
      version: MODEL_VERSION,
      provenance: "HEURISTIC",
      description:
        "OrbitGuard models environmental exposure from orbital altitude and inclination. This deterministic heuristic is not a live space-weather feed, density measurement, or radiation-dose calculation.",
      validDomain: "User-supplied LEO configuration: altitude 100–2000 km and inclination 0–180°.",
      limitations: [
        "No solar or geomagnetic activity input",
        "No atmospheric-density, ballistic-coefficient, particle-flux, shielding, or dose model"
      ]
    }
  };
}
