import mongoose from "mongoose";

const LIMITS = Object.freeze({
  altitude: { min: 100, max: 2000 },
  inclination: { min: 0, max: 180 },
  duration: { min: 1, max: 3650 }
});

const RISK_LEVELS = new Set(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
const ENVIRONMENT_LEVELS = new Set(["LOW", "MODERATE", "ELEVATED"]);
const WORKSPACE_ROLES = new Set(["ADMIN", "RESEARCHER", "VIEWER"]);

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  return value;
}

export function validateMissionConfiguration(value, { requireName = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }

  const allowed = requireName
    ? ["name", "altitude", "inclination", "duration"]
    : ["altitude", "inclination", "duration"];

  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`Unsupported field: ${key}`);
    }
  }

  const configuration = {};
  for (const [field, range] of Object.entries(LIMITS)) {
    const number = finiteNumber(value[field], field);
    if (number < range.min || number > range.max) {
      throw new Error(`${field} must be between ${range.min} and ${range.max}.`);
    }
    configuration[field] = number;
  }

  if (!requireName) return configuration;

  if (typeof value.name !== "string") {
    throw new Error("name must be a string.");
  }

  const name = value.name.trim();
  if (name.length < 1 || name.length > 120) {
    throw new Error("name must contain between 1 and 120 characters.");
  }

  return { name, ...configuration };
}

export function validateScenarioAssessmentSnapshot(assessment) {
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) {
    throw new Error("Scenario assessment is invalid.");
  }

  const configuration = validateMissionConfiguration(
    assessment.configuration
  );
  const risk = assessment.risk;
  const environment = assessment.environment;

  if (
    !risk || typeof risk !== "object" || Array.isArray(risk) ||
    typeof risk.score !== "number" || !Number.isFinite(risk.score) ||
    risk.score < 0 || risk.score > 100 ||
    !RISK_LEVELS.has(risk.level)
  ) {
    throw new Error("Scenario risk snapshot is invalid.");
  }

  if (
    !environment || typeof environment !== "object" || Array.isArray(environment) ||
    typeof environment.score !== "number" || !Number.isFinite(environment.score) ||
    environment.score < 0 || environment.score > 100 ||
    !ENVIRONMENT_LEVELS.has(environment.level)
  ) {
    throw new Error("Scenario environment snapshot is invalid.");
  }

  return {
    configuration,
    risk: { score: risk.score, level: risk.level },
    environment: {
      score: environment.score,
      level: environment.level
    }
  };
}

export function validateObjectId(parameter) {
  return (req, res, next) => {
    const value = req.params[parameter];
    if (!mongoose.isObjectIdOrHexString(value)) {
      return res.status(400).json({ success: false, message: `Invalid ${parameter}.` });
    }
    return next();
  };
}

// Analysis output and integrity data are always server-generated. The command
// accepts an empty object only, preventing clients from supplying a result,
// digest, or provenance that could be mistaken for an authoritative one.
export function validateAnalysisRunBody(req, res, next) {
  if (req.body === undefined) return next();
  if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body) || Object.keys(req.body).length !== 0) {
    return res.status(400).json({ success: false, error: { code: "INVALID_ANALYSIS_INPUT", message: "This command does not accept client-supplied analysis data." } });
  }
  return next();
}

export function validateTrustObjectId(parameter, code) {
  return (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params[parameter])) {
      return res.status(400).json({ success: false, error: { code, message: `Invalid ${parameter}.` } });
    }
    return next();
  };
}

export function validateAuthBody({ registration = false } = {}) {
  return (req, res, next) => {
    const body = req.body;
    const allowed = registration ? ["email", "password", "displayName"] : ["email", "password"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key)) || typeof body.email !== "string" || typeof body.password !== "string" || (registration && typeof body.displayName !== "string")) return res.status(400).json({ success: false, error: { code: "INVALID_AUTH_INPUT", message: "Invalid authentication request." } });
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.password.length < 12 || body.password.length > 256) return res.status(400).json({ success: false, error: { code: "INVALID_AUTH_INPUT", message: "Email or password does not meet requirements." } });
    req.body = registration ? { email, password: body.password, displayName: body.displayName.trim() } : { email, password: body.password };
    if (registration && (!req.body.displayName || req.body.displayName.length > 120)) return res.status(400).json({ success: false, error: { code: "INVALID_AUTH_INPUT", message: "Invalid display name." } });
    return next();
  };
}

export function validateWorkspaceBody(req, res, next) {
  if (!req.body || typeof req.body.name !== "string" || Object.keys(req.body).length !== 1 || !req.body.name.trim() || req.body.name.trim().length > 120) return res.status(400).json({ success: false, error: { code: "INVALID_WORKSPACE_INPUT", message: "Workspace name is required." } });
  req.body = { name: req.body.name.trim() }; return next();
}

export function validateMembershipBody(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length !== 2 || typeof req.body.userId !== "string" || !WORKSPACE_ROLES.has(req.body.role)) return res.status(400).json({ success: false, error: { code: "INVALID_MEMBERSHIP_INPUT", message: "userId and a non-owner role are required." } });
  return next();
}

export function validateDatasetBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "name" && key !== "description") || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160 || (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 2000))) return res.status(400).json({ success: false, error: { code: "INVALID_DATASET_INPUT", message: "Dataset name and optional description are invalid." } });
  req.body = { name: body.name.trim(), description: body.description?.trim() || "" }; return next();
}

function plainText(value, max) { return typeof value === "string" && value.trim().length <= max; }
export function validateProjectBody(req, res, next) {
  const body = req.body; if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["name", "description"].includes(key)) || !plainText(body.name, 160) || !body.name.trim() || (body.description !== undefined && !plainText(body.description, 3000))) return res.status(400).json({ success: false, error: { code: "INVALID_PROJECT_INPUT", message: "Project input is invalid." } });
  req.body = { name: body.name.trim(), description: body.description?.trim() || "" }; return next();
}
export function validateProjectPatch(req, res, next) {
  const body = req.body; if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some((key) => !["name", "description", "status"].includes(key)) || (body.name !== undefined && (!plainText(body.name, 160) || !body.name.trim())) || (body.description !== undefined && !plainText(body.description, 3000)) || (body.status !== undefined && !["ACTIVE", "ARCHIVED"].includes(body.status))) return res.status(400).json({ success: false, error: { code: "INVALID_PROJECT_INPUT", message: "Project update is invalid." } });
  return next();
}
export function validateExperimentBody(req, res, next) {
  const body = req.body; const allowed = ["name", "description", "objective", "hypothesis", "type", "status"];
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key)) || !plainText(body.name, 160) || !body.name.trim() || body.type !== "MISSION_RISK_ANALYSIS" || (body.description !== undefined && !plainText(body.description, 3000)) || (body.objective !== undefined && !plainText(body.objective, 2000)) || (body.hypothesis !== undefined && !plainText(body.hypothesis, 2000)) || (body.status !== undefined && !["DRAFT", "ACTIVE"].includes(body.status))) return res.status(400).json({ success: false, error: { code: "INVALID_EXPERIMENT_INPUT", message: "Experiment input is invalid." } });
  req.body = { name: body.name.trim(), description: body.description?.trim() || "", objective: body.objective?.trim() || "", hypothesis: body.hypothesis?.trim() || "", type: body.type, status: body.status || "DRAFT" }; return next();
}
export function validateExperimentPatch(req, res, next) {
  const body = req.body; const allowed = ["name", "description", "objective", "hypothesis", "status"];
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some((key) => !allowed.includes(key)) || (body.name !== undefined && (!plainText(body.name, 160) || !body.name.trim())) || (body.description !== undefined && !plainText(body.description, 3000)) || (body.objective !== undefined && !plainText(body.objective, 2000)) || (body.hypothesis !== undefined && !plainText(body.hypothesis, 2000)) || (body.status !== undefined && !["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(body.status))) return res.status(400).json({ success: false, error: { code: "INVALID_EXPERIMENT_INPUT", message: "Experiment update is invalid." } });
  return next();
}
export function validateExperimentRunBody(req, res, next) {
  const body = req.body; if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["datasetVersionIds", "parameters", "missionId"].includes(key)) || !Array.isArray(body.datasetVersionIds) || !body.datasetVersionIds.length || new Set(body.datasetVersionIds).size !== body.datasetVersionIds.length || !body.datasetVersionIds.every((id) => mongoose.isObjectIdOrHexString(id)) || (body.missionId !== undefined && body.missionId !== null && !mongoose.isObjectIdOrHexString(body.missionId))) return res.status(400).json({ success: false, error: { code: "INVALID_EXPERIMENT_PARAMETERS", message: "Dataset version references are invalid." } });
  try { const parameters = validateMissionConfiguration({ altitude: body.parameters?.altitudeKm, inclination: body.parameters?.inclinationDeg, duration: body.parameters?.durationDays }); req.body = { datasetVersionIds: body.datasetVersionIds, parameters: { altitudeKm: parameters.altitude, inclinationDeg: parameters.inclination, durationDays: parameters.duration }, missionId: body.missionId || null }; return next(); }
  catch { return res.status(400).json({ success: false, error: { code: "INVALID_EXPERIMENT_PARAMETERS", message: "Experiment parameters must be finite, in-domain values." } }); }
}

export function validateMissionBody(req, res, next) {
  try {
    req.body = validateMissionConfiguration(req.body, { requireName: true });
    return next();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export function validateScenarioBody(req, res, next) {
  try {
    req.body = validateMissionConfiguration(req.body);
    return next();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export function validateEnvironmentQuery(req, res, next) {
  try {
    if (Object.keys(req.query).some((key) => key !== "altitude" && key !== "inclination")) {
      throw new Error("Unsupported environment query parameter.");
    }
    const { altitude, inclination } = req.query;
    if (Array.isArray(altitude) || Array.isArray(inclination)) {
      throw new Error("altitude and inclination must be single values.");
    }
    req.environmentInput = validateMissionConfiguration({
      altitude: Number(altitude),
      inclination: Number(inclination),
      duration: 1
    });
    return next();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export function validateDecisionBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ success: false, message: "Request body must be a JSON object." });
  }

  const allowed = new Set(["decision", "reason", "source", "scenarioId"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return res.status(400).json({ success: false, message: "Request contains unsupported decision fields." });
  }

  if (typeof body.decision !== "string" || typeof body.reason !== "string") {
    return res.status(400).json({ success: false, message: "decision and reason must be strings." });
  }
  if (body.source !== undefined && body.source !== "CURRENT_CONFIGURATION" && body.source !== "SCENARIO_SIMULATION") {
    return res.status(400).json({ success: false, message: "source must be CURRENT_CONFIGURATION or SCENARIO_SIMULATION." });
  }
  if (body.source === "SCENARIO_SIMULATION" && !body.scenarioId) {
    return res.status(400).json({ success: false, message: "scenarioId is required for scenario decisions." });
  }

  if (body.scenarioId !== undefined && body.scenarioId !== null && !mongoose.isObjectIdOrHexString(body.scenarioId)) {
    return res.status(400).json({ success: false, message: "Invalid scenarioId." });
  }
  return next();
}

export function validateApplyScenarioBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, "scenarioId")) {
    return res.status(400).json({ success: false, message: "Request must contain only scenarioId." });
  }
  if (!mongoose.isObjectIdOrHexString(body.scenarioId)) {
    return res.status(400).json({ success: false, message: "Invalid scenarioId." });
  }
  return next();
}
