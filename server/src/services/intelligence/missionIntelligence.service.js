function getPriority(risk, environment) {
  const riskScore = Number(risk?.score) || 0;
  const environmentScore =
    Number(environment?.score) || 0;

  const combinedScore =
    riskScore + environmentScore;

  if (
    riskScore >= 75 ||
    combinedScore >= 90
  ) {
    return "CRITICAL";
  }

  if (
    riskScore >= 50 ||
    combinedScore >= 65
  ) {
    return "HIGH";
  }

  if (
    riskScore >= 25 ||
    environmentScore >= 25
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function getPrimaryConcern(risk) {
  const activeFactors =
    risk?.activeFactors || [];

  if (activeFactors.length === 0) {
    return {
      category: null,
      title: "No dominant risk identified",
      explanation:
        "The current rule set does not identify a significant mission risk factor.",
      severity: "LOW"
    };
  }

  const primaryFactor =
    [...activeFactors].sort(
      (a, b) =>
        (Number(b.score) || 0) -
        (Number(a.score) || 0)
    )[0];

  return {
    category: primaryFactor.category,
    title: primaryFactor.title,
    explanation: primaryFactor.explanation,
    severity: primaryFactor.severity
  };
}

function getPrimaryEnvironmentConcern(
  environment
) {
  const activeFactors =
    environment?.activeFactors || [];

  if (activeFactors.length === 0) {
    return null;
  }

  return [...activeFactors].sort(
    (a, b) =>
      (Number(b.score) || 0) -
      (Number(a.score) || 0)
  )[0];
}

function buildActions(risk, environment) {
  const actions = [];
  const seen = new Set();

  for (const factor of risk?.activeFactors || []) {
    let action = null;

    if (factor.category === "ALTITUDE") {
      action = {
        priority:
          factor.severity === "CRITICAL" ||
          factor.severity === "HIGH"
            ? "HIGH"
            : "MEDIUM",

        title:
          "Evaluate orbital lifetime",

        reason:
          "Assess atmospheric drag, expected orbital decay and station-keeping requirements."
      };
    }

    if (factor.category === "INCLINATION") {
      action = {
        priority: "MEDIUM",

        title:
          "Validate orbital geometry",

        reason:
          "Check inclination against mission coverage, launch geometry and ground-track requirements."
      };
    }

    if (factor.category === "DURATION") {
      action = {
        priority: "MEDIUM",

        title:
          "Plan long-duration monitoring",

        reason:
          "Define periodic mission-health reviews and reassess orbital conditions throughout the mission."
      };
    }

    if (factor.category === "INTERACTION") {
      action = {
        priority:
          factor.severity === "HIGH"
            ? "HIGH"
            : "MEDIUM",

        title:
          "Assess combined mission exposure",

        reason:
          factor.explanation
      };
    }

    if (
      action &&
      !seen.has(action.title)
    ) {
      seen.add(action.title);
      actions.push(action);
    }
  }

  for (
    const factor of
    environment?.activeFactors || []
  ) {
    if (
      factor.category ===
      "ATMOSPHERIC_DRAG"
    ) {
      const action = {
        priority: "HIGH",

        title:
          "Evaluate environmental drag exposure",

        reason:
          "Assess atmospheric-density uncertainty, orbital decay and station-keeping requirements for the selected altitude."
      };

      if (!seen.has(action.title)) {
        seen.add(action.title);
        actions.push(action);
      }
    }

    if (
      factor.category ===
      "RADIATION"
    ) {
      const action = {
        priority: "MEDIUM",

        title:
          "Evaluate radiation environment",

        reason:
          "Review spacecraft radiation tolerance and mission exposure assumptions for the selected orbital geometry."
      };

      if (!seen.has(action.title)) {
        seen.add(action.title);
        actions.push(action);
      }
    }
  }

  if (actions.length === 0) {
    actions.push({
      priority: "LOW",

      title:
        "Continue baseline monitoring",

      reason:
        "No additional action is currently required by the OrbitGuard assessment models."
    });
  }

  return actions;
}

function getReadiness(
  risk,
  environment
) {
  const riskScore =
    Number(risk?.score) || 0;

  const environmentScore =
    Number(environment?.score) || 0;

  if (
    riskScore >= 75
  ) {
    return {
      status: "HOLD_FOR_REVIEW",

      label:
        "Hold for detailed review",

      explanation:
        "The current mission configuration contains significant risk factors and should not proceed without additional review."
    };
  }

  if (
    riskScore >= 50
  ) {
    return {
      status: "REVIEW_RECOMMENDED",

      label:
        "Review recommended",

      explanation:
        "The mission can continue through planning, but important risk factors require additional assessment."
    };
  }

  if (
    environmentScore >= 25
  ) {
    return {
      status:
        "ENVIRONMENTAL_REVIEW",

      label:
        "Environmental review recommended",

      explanation:
        "The orbital risk model remains within a manageable range, but modeled environmental exposure requires additional attention."
    };
  }

  if (
    riskScore >= 25
  ) {
    return {
      status: "MONITOR",

      label:
        "Monitor closely",

      explanation:
        "The current configuration presents moderate concerns that should remain under observation."
    };
  }

  return {
    status: "BASELINE",

    label:
      "Baseline configuration",

    explanation:
      "No significant concerns were identified by the current OrbitGuard assessment models."
  };
}

function getDecision(
  risk,
  environment
) {
  const riskScore =
    Number(risk?.score) || 0;

  const environmentScore =
    Number(environment?.score) || 0;

  if (riskScore >= 75) {
    return {
      status: "HOLD",

      label:
        "HOLD FOR REVIEW",

      severity: "CRITICAL",

      explanation:
        "The current orbital configuration presents significant modeled mission risk. Detailed review is required before proceeding."
    };
  }

  if (riskScore >= 50) {
    return {
      status: "REVIEW",

      label:
        "REVIEW BEFORE PROCEEDING",

      severity: "HIGH",

      explanation:
        "The current configuration contains important risk factors that should be evaluated before mission approval."
    };
  }

  if (
    environmentScore >= 25
  ) {
    return {
      status: "ENVIRONMENT_REVIEW",

      label:
        "ENVIRONMENTAL REVIEW",

      severity: "MEDIUM",

      explanation:
        "The orbital configuration remains within the modeled mission-risk envelope, but environmental exposure requires additional review."
    };
  }

  if (riskScore >= 25) {
    return {
      status: "MONITOR",

      label:
        "PROCEED WITH MONITORING",

      severity: "MEDIUM",

      explanation:
        "The configuration remains assessable, but identified risk factors should be monitored during planning and operations."
    };
  }

  return {
    status: "PROCEED",

    label:
      "BASELINE — PROCEED",

    severity: "LOW",

    explanation:
      "The configuration remains within the baseline risk and environmental envelope defined by the current OrbitGuard models."
  };
}

function buildSummary(
  mission,
  risk,
  primaryConcern,
  environment
) {
  const environmentText =
    environment?.level === "ELEVATED"
      ? " Modeled environmental exposure also requires attention."
      : "";

  if (risk.score >= 75) {
    return `Mission "${mission.name}" requires detailed review. The current configuration has a ${risk.level.toLowerCase()} risk level, with ${primaryConcern.title.toLowerCase()} identified as the dominant concern.${environmentText}`;
  }

  if (risk.score >= 50) {
    return `Mission "${mission.name}" requires additional assessment. The current configuration has a ${risk.level.toLowerCase()} risk level, primarily driven by ${primaryConcern.title.toLowerCase()}.${environmentText}`;
  }

  if (risk.score >= 25) {
    return `Mission "${mission.name}" has moderate operational considerations. Continued monitoring is recommended, with ${primaryConcern.title.toLowerCase()} as the main concern.${environmentText}`;
  }

  return `Mission "${mission.name}" currently presents a low level of risk under the configured OrbitGuard rules.${environmentText}`;
}

function buildDecisionExplanation(
  risk,
  primaryConcern,
  environment
) {
  if (risk.score >= 75) {
    return `Immediate attention is recommended because ${primaryConcern.title.toLowerCase()} represents a significant operational concern under the current model.`;
  }

  if (risk.score >= 50) {
    return `Additional assessment is recommended because ${primaryConcern.title.toLowerCase()} is materially contributing to mission risk.`;
  }

  if (
    environment?.score >= 25
  ) {
    const concern =
      getPrimaryEnvironmentConcern(
        environment
      );

    return `The orbital risk remains manageable, but ${concern?.title?.toLowerCase() || "environmental exposure"} requires additional attention under the environmental model.`;
  }

  if (risk.score >= 25) {
    return `The mission remains assessable, but ${primaryConcern.title.toLowerCase()} should be monitored during planning and operations.`;
  }

  return "The current configuration remains within the baseline risk and environmental envelope defined by the OrbitGuard assessment models.";
}

export function generateMissionIntelligence(
  mission,
  risk,
  environment = null
) {
  const primaryConcern =
    getPrimaryConcern(risk);

  const primaryEnvironmentConcern =
    getPrimaryEnvironmentConcern(
      environment
    );

  const priority =
    getPriority(
      risk,
      environment
    );

  const readiness =
    getReadiness(
      risk,
      environment
    );

  const decision =
    getDecision(
      risk,
      environment
    );

  const actions =
    buildActions(
      risk,
      environment
    );

  return {
    summary:
      buildSummary(
        mission,
        risk,
        primaryConcern,
        environment
      ),

    decision,

    decisionExplanation:
      buildDecisionExplanation(
        risk,
        primaryConcern,
        environment
      ),

    priority,

    readiness,

    primaryConcern,

    primaryEnvironmentConcern,

    actions,

    operationalPosture:
      risk.operationalPosture,

    ruleCoverage:
      risk.ruleCoverage,

    riskBreakdown: {
      score: risk.score,
      level: risk.level,

      activeFactorCount:
        risk.activeFactors?.length || 0,

      factorContribution:
        risk.factorContribution || []
    },

    environment: environment
      ? {
          score:
            environment.score,

          level:
            environment.level,

          posture:
            environment.posture,

          activeFactors:
            environment.activeFactors || [],

          methodology:
            environment.methodology
        }
      : null,

    methodology:
      risk.methodology
  };
}
