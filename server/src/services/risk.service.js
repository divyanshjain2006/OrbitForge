const RISK_LIMIT = 100;

const RISK_MODEL_VERSION = "2.0.0";

function createRiskFactor({
  category,
  severity,
  score,
  title,
  explanation,
  signal,
  recommendation
}) {
  return {
    category,
    severity,
    score,
    title,
    explanation,
    signal,
    recommendation
  };
}

/*
 * ALTITUDE
 *
 * Lower LEO altitude generally means greater atmospheric-drag
 * exposure. Higher altitude reduces drag but introduces different
 * mission-planning considerations.
 */
function calculateAltitudeRisk(altitude) {
  if (altitude < 250) {
    return createRiskFactor({
      category: "ALTITUDE",
      severity: "CRITICAL",
      score: 45,
      title: "Extremely low orbital altitude",
      explanation:
        "The mission operates at an extremely low altitude where atmospheric drag can strongly affect orbital lifetime and increase station-keeping requirements.",
      signal: "HIGH_DRAG_EXPOSURE",
      recommendation:
        "Perform detailed orbital-lifetime and atmospheric-drag analysis before proceeding."
    });
  }

  if (altitude < 300) {
    return createRiskFactor({
      category: "ALTITUDE",
      severity: "HIGH",
      score: 35,
      title: "Low orbital altitude",
      explanation:
        "Very low LEO orbits are more exposed to atmospheric drag, which can accelerate orbital decay and increase station-keeping requirements.",
      signal: "ELEVATED_DRAG_EXPOSURE",
      recommendation:
        "Evaluate atmospheric drag, orbital lifetime and station-keeping requirements."
    });
  }

  if (altitude < 450) {
    return createRiskFactor({
      category: "ALTITUDE",
      severity: "MODERATE",
      score: 20,
      title: "Relatively low orbital altitude",
      explanation:
        "The mission operates in a region where atmospheric drag can have a noticeable effect on orbital lifetime.",
      signal: "MODERATE_DRAG_EXPOSURE",
      recommendation:
        "Include atmospheric-drag and orbital-decay scenarios in mission planning."
    });
  }

  if (altitude <= 800) {
    return createRiskFactor({
      category: "ALTITUDE",
      severity: "LOW",
      score: 0,
      title: "Stable LEO altitude range",
      explanation:
        "The configured altitude is within a commonly used LEO operating range with comparatively manageable atmospheric-drag effects.",
      signal: "NOMINAL",
      recommendation:
        "Continue baseline orbital monitoring."
    });
  }

  if (altitude <= 1200) {
    return createRiskFactor({
      category: "ALTITUDE",
      severity: "LOW",
      score: 5,
      title: "Higher LEO altitude",
      explanation:
        "The higher orbit generally reduces atmospheric drag, but other mission-planning considerations can become more significant.",
      signal: "ELEVATED_ALTITUDE",
      recommendation:
        "Validate the altitude against mission objectives and operational constraints."
    });
  }

  return createRiskFactor({
    category: "ALTITUDE",
    severity: "MODERATE",
    score: 15,
    title: "High LEO altitude",
    explanation:
      "The configured altitude is relatively high for LEO and should be evaluated against the mission's operational objectives and constraints.",
    signal: "HIGH_LEO_ALTITUDE",
    recommendation:
      "Validate the selected altitude against mission objectives and operational requirements."
  });
}

/*
 * INCLINATION
 *
 * This is deliberately treated as an operational/geometry signal,
 * not as an inherently dangerous orbital configuration.
 */
function calculateInclinationRisk(inclination) {
  if (inclination > 120) {
    return createRiskFactor({
      category: "INCLINATION",
      severity: "MODERATE",
      score: 15,
      title: "High orbital inclination",
      explanation:
        "A high inclination can introduce additional mission-planning and ground-track considerations depending on spacecraft objectives.",
      signal: "HIGH_INCLINATION",
      recommendation:
        "Validate inclination against coverage, launch geometry and ground-track requirements."
    });
  }

  if (inclination > 90) {
    return createRiskFactor({
      category: "INCLINATION",
      severity: "LOW",
      score: 10,
      title: "High operational inclination",
      explanation:
        "The selected inclination may increase operational complexity and should be evaluated against intended coverage and launch profile.",
      signal: "ELEVATED_INCLINATION",
      recommendation:
        "Validate the selected inclination against mission coverage and launch geometry."
    });
  }

  return createRiskFactor({
    category: "INCLINATION",
    severity: "LOW",
    score: 0,
    title: "Nominal inclination",
    explanation:
      "No additional inclination-related complexity is identified by the current rule set.",
    signal: "NOMINAL",
    recommendation:
      "Continue baseline orbital-geometry validation."
  });
}

/*
 * DURATION
 */
function calculateDurationRisk(duration) {
  if (duration > 1095) {
    return createRiskFactor({
      category: "DURATION",
      severity: "HIGH",
      score: 25,
      title: "Very long mission duration",
      explanation:
        "A multi-year mission increases the period over which orbital, environmental and operational uncertainties can accumulate.",
      signal: "LONG_TERM_EXPOSURE",
      recommendation:
        "Establish long-term orbital monitoring and periodic mission reassessment."
    });
  }

  if (duration > 730) {
    return createRiskFactor({
      category: "DURATION",
      severity: "MODERATE",
      score: 20,
      title: "Long mission duration",
      explanation:
        "Long-duration missions increase the time over which orbital, environmental and operational uncertainties can accumulate.",
      signal: "EXTENDED_EXPOSURE",
      recommendation:
        "Plan continuous orbital monitoring and periodic mission-health reviews."
    });
  }

  if (duration > 365) {
    return createRiskFactor({
      category: "DURATION",
      severity: "LOW",
      score: 10,
      title: "Extended mission duration",
      explanation:
        "An extended mission requires continued monitoring of orbital and operational conditions over a longer period.",
      signal: "EXTENDED_MISSION",
      recommendation:
        "Define periodic mission-health reassessment checkpoints."
    });
  }

  return createRiskFactor({
    category: "DURATION",
    severity: "LOW",
    score: 0,
    title: "Nominal mission duration",
    explanation:
      "The configured duration does not introduce an additional duration-related risk under the current rules.",
    signal: "NOMINAL",
    recommendation:
      "Continue baseline mission monitoring."
  });
}

/*
 * INTERACTION RISK
 *
 * Individual factors can become more important when they occur
 * together. This makes the engine more useful than simply adding
 * three independent scores.
 */
function calculateInteractionRisk({
  altitude,
  duration,
  altitudeFactor,
  durationFactor
}) {
  const interactions = [];

  if (altitude < 300 && duration > 730) {
    interactions.push(
      createRiskFactor({
        category: "INTERACTION",
        severity: "HIGH",
        score: 15,
        title: "Low altitude + long-duration exposure",
        explanation:
          "A very low orbit combined with a long mission duration increases the importance of atmospheric-drag, orbital-decay and station-keeping planning.",
        signal: "COMBINED_DECAY_EXPOSURE",
        recommendation:
          "Perform integrated orbital-lifetime and long-duration station-keeping analysis."
      })
    );
  }

  if (
    altitude < 450 &&
    duration > 365 &&
    altitudeFactor.score > 0 &&
    durationFactor.score > 0
  ) {
    interactions.push(
      createRiskFactor({
        category: "INTERACTION",
        severity: "MODERATE",
        score: 8,
        title: "Extended exposure at lower altitude",
        explanation:
          "Lower altitude and extended mission duration jointly increase the importance of orbital-decay monitoring.",
        signal: "COMBINED_OPERATIONAL_EXPOSURE",
        recommendation:
          "Include orbital-decay trends in recurring mission-health reviews."
      })
    );
  }

  return interactions;
}

function getRiskLevel(score) {
  if (score >= 75) {
    return "CRITICAL";
  }

  if (score >= 50) {
    return "HIGH";
  }

  if (score >= 25) {
    return "MODERATE";
  }

  return "LOW";
}

function getOperationalPosture(score) {
  if (score >= 75) {
    return {
      status: "HOLD_FOR_REVIEW",
      label: "Hold for detailed review"
    };
  }

  if (score >= 50) {
    return {
      status: "REVIEW_BEFORE_PROCEEDING",
      label: "Review before proceeding"
    };
  }

  if (score >= 25) {
    return {
      status: "MONITOR",
      label: "Monitor closely"
    };
  }

  return {
    status: "BASELINE",
    label: "Baseline operations"
  };
}

function getRuleCoverage(activeFactors) {
  if (activeFactors.length >= 3) {
    return "HIGH";
  }

  if (activeFactors.length >= 1) {
    return "MODERATE";
  }

  return "BASELINE";
}

function buildRecommendations(factors, riskLevel) {
  const recommendations = [];

  for (const factor of factors) {
    if (
      factor.score > 0 &&
      factor.recommendation
    ) {
      recommendations.push(
        factor.recommendation
      );
    }
  }

  if (riskLevel === "LOW") {
    recommendations.push(
      "Continue baseline mission analysis and monitor for changing mission conditions."
    );
  }

  if (riskLevel === "MODERATE") {
    recommendations.push(
      "Perform additional scenario analysis before final mission approval."
    );
  }

  if (
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL"
  ) {
    recommendations.push(
      "Conduct detailed mission review before proceeding with the current configuration."
    );
  }

  return [...new Set(recommendations)];
}

function calculateFactorContribution(
  activeFactors,
  totalScore
) {
  return activeFactors.map((factor) => ({
    category: factor.category,
    score: factor.score,
    percentage:
      totalScore > 0
        ? Math.round(
            (factor.score / totalScore) * 100
          )
        : 0
  }));
}

export function calculateMissionRisk(mission) {
  const altitude = Number(mission.altitude);
  const inclination = Number(
    mission.inclination
  );
  const duration = Number(mission.duration);

  if (
    !Number.isFinite(altitude) ||
    !Number.isFinite(inclination) ||
    !Number.isFinite(duration)
  ) {
    throw new Error(
      "Invalid mission parameters"
    );
  }

  if (
    altitude < 100 || altitude > 2000 ||
    inclination < 0 || inclination > 180 ||
    duration < 1 || duration > 3650
  ) {
    throw new Error(
      "Mission parameters are outside OrbitGuard's supported LEO configuration domain"
    );
  }

  const altitudeFactor =
    calculateAltitudeRisk(altitude);

  const inclinationFactor =
    calculateInclinationRisk(inclination);

  const durationFactor =
    calculateDurationRisk(duration);

  const interactionFactors =
    calculateInteractionRisk({
      altitude,
      duration,
      altitudeFactor,
      durationFactor
    });

  const factors = [
    altitudeFactor,
    inclinationFactor,
    durationFactor,
    ...interactionFactors
  ];

  const rawScore = factors.reduce(
    (total, factor) =>
      total + factor.score,
    0
  );

  const score = Math.min(
    rawScore,
    RISK_LIMIT
  );

  const level = getRiskLevel(score);

  const activeFactors =
    factors.filter(
      (factor) => factor.score > 0
    );

  const operationalPosture =
    getOperationalPosture(score);

  const ruleCoverage =
    getRuleCoverage(activeFactors);

  return {
    score,
    level,

    operationalPosture,

    ruleCoverage,

    methodology: {
      type: "deterministic-rule-engine",
      version: RISK_MODEL_VERSION,
      provenance: "HEURISTIC",
      description:
        "OrbitGuard risk assessment combines orbital altitude, inclination, mission duration and interacting mission conditions using an explainable deterministic heuristic rule engine. It is not a probability or uncertainty estimate."
    },

    factors,

    activeFactors,

    factorContribution:
      calculateFactorContribution(
        activeFactors,
        score
      ),

    recommendations:
      buildRecommendations(
        factors,
        level
      )
  };
}
