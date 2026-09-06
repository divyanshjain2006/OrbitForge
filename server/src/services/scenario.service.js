import { calculateMissionRisk } from "./risk.service.js";

import {
  assessSpaceEnvironment
} from "./spaceEnvironment/spaceEnvironment.service.js";

function validateScenarioInput(data) {
  const altitude = Number(data.altitude);
  const inclination = Number(data.inclination);
  const duration = Number(data.duration);

  if (
    !Number.isFinite(altitude) ||
    !Number.isFinite(inclination) ||
    !Number.isFinite(duration)
  ) {
    throw new Error(
      "Altitude, inclination and duration must be valid numbers."
    );
  }

  if (altitude < 100 || altitude > 2000) {
    throw new Error(
      "Orbital altitude must be between 100 km and 2000 km."
    );
  }

  if (inclination < 0 || inclination > 180) {
    throw new Error(
      "Orbital inclination must be between 0 and 180 degrees."
    );
  }

  if (duration < 1 || duration > 3650) {
    throw new Error(
      "Mission duration must be between 1 and 3650 days."
    );
  }

  return {
    altitude,
    inclination,
    duration
  };
}

function getRiskDelta(currentRisk, scenarioRisk) {
  const scoreDelta =
    scenarioRisk.score - currentRisk.score;

  let direction = "UNCHANGED";

  if (scoreDelta > 0) {
    direction = "WORSENED";
  }

  if (scoreDelta < 0) {
    direction = "IMPROVED";
  }

  return {
    scoreDelta,
    direction,
    absoluteChange: Math.abs(scoreDelta)
  };
}

function getEnvironmentDelta(
  currentEnvironment,
  scenarioEnvironment
) {
  const scoreDelta =
    scenarioEnvironment.score -
    currentEnvironment.score;

  let direction = "UNCHANGED";

  if (scoreDelta > 0) {
    direction = "WORSENED";
  }

  if (scoreDelta < 0) {
    direction = "IMPROVED";
  }

  return {
    scoreDelta,
    direction,
    absoluteChange: Math.abs(scoreDelta),
    previousLevel: currentEnvironment.level,
    scenarioLevel: scenarioEnvironment.level
  };
}

function compareFactors(currentRisk, scenarioRisk) {
  const currentFactors = new Map(
    currentRisk.factors.map((factor) => [
      factor.category,
      factor
    ])
  );

  const scenarioFactors = new Map(
    scenarioRisk.factors.map((factor) => [
      factor.category,
      factor
    ])
  );

  const categories = new Set([
    ...currentFactors.keys(),
    ...scenarioFactors.keys()
  ]);

  return [...categories].map((category) => {
    const current = currentFactors.get(category);
    const scenario = scenarioFactors.get(category);

    const currentScore = current?.score || 0;
    const scenarioScore = scenario?.score || 0;

    return {
      category,
      currentScore,
      scenarioScore,
      scoreDelta:
        scenarioScore - currentScore,
      changed:
        currentScore !== scenarioScore
    };
  });
}

function compareEnvironmentFactors(
  currentEnvironment,
  scenarioEnvironment
) {
  const currentFactors = new Map(
    currentEnvironment.factors.map((factor) => [
      factor.category,
      factor
    ])
  );

  const scenarioFactors = new Map(
    scenarioEnvironment.factors.map((factor) => [
      factor.category,
      factor
    ])
  );

  const categories = new Set([
    ...currentFactors.keys(),
    ...scenarioFactors.keys()
  ]);

  return [...categories].map((category) => {
    const current =
      currentFactors.get(category);

    const scenario =
      scenarioFactors.get(category);

    const currentScore =
      current?.score || 0;

    const scenarioScore =
      scenario?.score || 0;

    return {
      category,
      currentLevel:
        current?.level || "LOW",
      scenarioLevel:
        scenario?.level || "LOW",
      currentScore,
      scenarioScore,
      scoreDelta:
        scenarioScore - currentScore,
      changed:
        currentScore !== scenarioScore ||
        current?.level !== scenario?.level
    };
  });
}

function buildScenarioExplanation(
  currentRisk,
  scenarioRisk,
  riskDelta,
  factorComparison
) {
  if (riskDelta.direction === "UNCHANGED") {
    return "The scenario produces the same overall risk score under the current deterministic rules.";
  }

  const changedFactors = factorComparison.filter(
    (factor) => factor.changed
  );

  const factorText = changedFactors
    .map((factor) => {
      const direction =
        factor.scoreDelta > 0
          ? "increased"
          : "decreased";

      return `${factor.category.toLowerCase()} risk ${direction} by ${Math.abs(
        factor.scoreDelta
      )} points`;
    })
    .join(", ");

  if (riskDelta.direction === "IMPROVED") {
    return `The scenario improves the mission risk profile: the overall risk score decreases by ${riskDelta.absoluteChange} points. ${
      factorText ||
      "Risk-factor contributions changed."
    }.`;
  }

  return `The scenario worsens the mission risk profile: the overall risk score increases by ${riskDelta.absoluteChange} points. ${
    factorText ||
    "Risk-factor contributions changed."
  }.`;
}

function buildEnvironmentExplanation(
  currentEnvironment,
  scenarioEnvironment,
  environmentDelta,
  factorComparison
) {
  if (
    environmentDelta.direction ===
    "UNCHANGED"
  ) {
    return "The scenario produces the same modeled environmental exposure under the current environmental assessment rules.";
  }

  const changedFactors =
    factorComparison.filter(
      (factor) => factor.changed
    );

  const factorText = changedFactors
    .map((factor) => {
      const direction =
        factor.scoreDelta > 0
          ? "increased"
          : "decreased";

      return `${factor.category
        .toLowerCase()
        .replace(/_/g, " ")} exposure ${direction} by ${Math.abs(
        factor.scoreDelta
      )} points`;
    })
    .join(", ");

  if (
    environmentDelta.direction ===
    "IMPROVED"
  ) {
    return `The scenario improves modeled environmental exposure: the environment score decreases by ${environmentDelta.absoluteChange} points. ${
      factorText ||
      "Environmental-factor contributions changed."
    }.`;
  }

  return `The scenario increases modeled environmental exposure: the environment score increases by ${environmentDelta.absoluteChange} points. ${
    factorText ||
    "Environmental-factor contributions changed."
  }.`;
}

function buildOverallScenarioDecision(
  riskDelta,
  environmentDelta
) {
  if (
    riskDelta.direction === "IMPROVED" &&
    environmentDelta.direction === "IMPROVED"
  ) {
    return {
      status: "IMPROVED",
      label: "IMPROVED",
      severity: "POSITIVE",
      explanation:
        "The scenario improves both mission risk and modeled environmental exposure."
    };
  }

  if (
    riskDelta.direction === "WORSENED" &&
    environmentDelta.direction === "WORSENED"
  ) {
    return {
      status: "WORSENED",
      label: "WORSENED",
      severity: "HIGH",
      explanation:
        "The scenario increases both mission risk and modeled environmental exposure."
    };
  }

  if (
    riskDelta.direction === "UNCHANGED" &&
    environmentDelta.direction === "UNCHANGED"
  ) {
    return {
      status: "UNCHANGED",
      label: "UNCHANGED",
      severity: "NEUTRAL",
      explanation:
        "The scenario does not materially change either mission risk or modeled environmental exposure."
    };
  }

  return {
    status: "MIXED",
    label: "MIXED IMPACT",
    severity: "MEDIUM",
    explanation:
      "The scenario produces mixed effects across mission risk and modeled environmental exposure and should be reviewed before adoption."
  };
}

export function analyzeMissionScenario({
  currentMission,
  scenario
}) {
  if (!currentMission) {
    throw new Error(
      "Current mission configuration is required."
    );
  }

  const validatedScenario =
    validateScenarioInput(scenario);

  const currentRisk =
    calculateMissionRisk(currentMission);

  const scenarioMission = {
    name:
      currentMission.name ||
      "Scenario Mission",
    altitude:
      validatedScenario.altitude,
    inclination:
      validatedScenario.inclination,
    duration:
      validatedScenario.duration
  };

  const scenarioRisk =
    calculateMissionRisk(scenarioMission);

  const currentEnvironment =
    assessSpaceEnvironment(currentMission);

  const scenarioEnvironment =
    assessSpaceEnvironment(
      scenarioMission
    );

  const riskDelta =
    getRiskDelta(
      currentRisk,
      scenarioRisk
    );

  const environmentDelta =
    getEnvironmentDelta(
      currentEnvironment,
      scenarioEnvironment
    );

  const factorComparison =
    compareFactors(
      currentRisk,
      scenarioRisk
    );

  const environmentFactorComparison =
    compareEnvironmentFactors(
      currentEnvironment,
      scenarioEnvironment
    );

  const overallDecision =
    buildOverallScenarioDecision(
      riskDelta,
      environmentDelta
    );

  return {
    current: {
      configuration: {
        altitude:
          Number(currentMission.altitude),
        inclination:
          Number(currentMission.inclination),
        duration:
          Number(currentMission.duration)
      },

      risk: currentRisk,

      environment: currentEnvironment
    },

    scenario: {
      configuration:
        validatedScenario,

      risk: scenarioRisk,

      environment:
        scenarioEnvironment
    },

    comparison: {
      ...riskDelta,

      previousLevel:
        currentRisk.level,

      scenarioLevel:
        scenarioRisk.level,

      factorComparison,

      explanation:
        buildScenarioExplanation(
          currentRisk,
          scenarioRisk,
          riskDelta,
          factorComparison
        )
    },

    environmentComparison: {
      ...environmentDelta,

      factorComparison:
        environmentFactorComparison,

      explanation:
        buildEnvironmentExplanation(
          currentEnvironment,
          scenarioEnvironment,
          environmentDelta,
          environmentFactorComparison
        )
    },

    overallDecision
  };
}