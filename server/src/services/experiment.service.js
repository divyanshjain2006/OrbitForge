import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Experiment from "../models/experiment.model.js";
import ExperimentRun from "../models/experimentRun.model.js";
import Dataset from "../models/dataset.model.js";
import DatasetVersion from "../models/datasetVersion.model.js";
import Mission from "../models/mission.model.js";
import ResearchRecord from "../models/researchRecord.model.js";
import IntegrityManifest from "../models/integrityManifest.model.js";
import { calculateOrbitalAnalysis } from "./analysis/orbitalAnalysis.service.js";
import { calculateMissionRisk } from "./risk.service.js";
import { assessSpaceEnvironment } from "./spaceEnvironment/spaceEnvironment.service.js";
import { CANONICALIZATION_VERSION, HASH_ALGORITHM, sha256Digest } from "./integrity.service.js";

export const RISK_METHOD = Object.freeze({ name: "OrbitForge Deterministic Risk Engine", version: "2.0.0", type: "HEURISTIC" });
export const createProject = (input) => Project.create(input);
export const listProjects = (workspaceId) => Project.find({ workspaceId }).sort({ createdAt: -1 }).lean();
export const createExperiment = (input) => Experiment.create({ ...input, method: RISK_METHOD });
export const listExperiments = (projectId) => Experiment.find({ projectId }).sort({ createdAt: -1 }).lean();
export const listRuns = (experimentId) => ExperimentRun.find({ experimentId }).sort({ createdAt: -1 }).lean();

// Authorization middleware deliberately loads lean ownership snapshots. Use
// targeted updates here rather than assuming those snapshots are Mongoose docs.
export function updateProject(project, changes) { return Project.findByIdAndUpdate(project._id, changes, { new: true, runValidators: true }); }
export function updateExperiment(experiment, changes) { return Experiment.findByIdAndUpdate(experiment._id, changes, { new: true, runValidators: true }); }

async function resolveDatasetVersions(ids, workspaceId) {
  const versions = await DatasetVersion.find({ _id: { $in: ids } }).lean();
  if (versions.length !== ids.length) { const error = new Error("Dataset version not found."); error.code = "DATASET_VERSION_NOT_FOUND"; throw error; }
  const datasets = await Dataset.find({ _id: { $in: versions.map((version) => version.datasetId) } }).lean();
  const byId = new Map(datasets.map((dataset) => [String(dataset._id), dataset]));
  for (const version of versions) {
    const dataset = byId.get(String(version.datasetId));
    if (!dataset || String(dataset.workspaceId) !== String(workspaceId)) { const error = new Error("Dataset version belongs to another workspace."); error.code = "WORKSPACE_ACCESS_DENIED"; throw error; }
    if (version.validationStatus === "INVALID" || version.validationStatus === "PENDING") { const error = new Error("Dataset version is not valid for execution."); error.code = "INVALID_DATASET_VERSION"; throw error; }
  }
  return ids.map((id) => versions.find((version) => String(version._id) === String(id)));
}

export function runMissionRiskComputation(parameters) {
  // This stable synthetic identifier prevents a database ObjectId from leaking
  // into deterministic scientific output or its semantic integrity payload.
  const mission = { _id: "experiment-configuration", name: "Experiment configuration", altitude: parameters.altitudeKm, inclination: parameters.inclinationDeg, duration: parameters.durationDays };
  const risk = calculateMissionRisk(mission);
  const environment = assessSpaceEnvironment(mission);
  const orbital = calculateOrbitalAnalysis(mission);
  return { summary: `Deterministic mission-risk analysis produced ${risk.level.toLowerCase()} risk and ${environment.level.toLowerCase()} environmental exposure.`, metrics: { riskScore: risk.score, environmentScore: environment.score, riskLevel: risk.level, environmentLevel: environment.level }, outputs: { orbital, risk, environment } };
}

export function buildExperimentSemanticPayload({ datasetVersions, parameters, results, method, type }) {
  return { recordVersion: "1.0", artifact: "EXPERIMENT_RUN", experimentType: type, datasetVersions: datasetVersions.map((version) => ({ version: version.version, rawPayloadHash: version.rawPayloadHash, normalizedPayloadHash: version.normalizedPayloadHash, validationStatus: version.validationStatus })).sort((a, b) => a.normalizedPayloadHash.localeCompare(b.normalizedPayloadHash)), parameters, method, results };
}

async function createResearchArtifact(runId, payload, provenance) {
  const recordId = new mongoose.Types.ObjectId(); const manifestId = new mongoose.Types.ObjectId();
  const digest = sha256Digest(payload);
  await IntegrityManifest.create({ _id: manifestId, researchRecordId: recordId, algorithm: HASH_ALGORITHM, canonicalizationVersion: CANONICALIZATION_VERSION, digest, createdBy: "OrbitForge experiment service" });
  try {
    return await ResearchRecord.create({ _id: recordId, artifactType: "EXPERIMENT_RUN", experimentRunId: runId, recordVersion: "1.0", semanticPayload: payload, canonicalizationVersion: CANONICALIZATION_VERSION, integrityManifestId: manifestId, provenance });
  } catch (error) { await IntegrityManifest.deleteOne({ _id: manifestId }); throw error; }
}

export async function executeExperiment(experiment, workspaceId, request, userId, { reproducedFromRun = null } = {}) {
  const datasetVersions = await resolveDatasetVersions(request.datasetVersionIds, workspaceId);
  if (request.missionId) {
    const mission = await Mission.findById(request.missionId).lean();
    if (!mission || String(mission.workspaceId) !== String(workspaceId)) { const error = new Error("Mission not found in workspace."); error.code = "WORKSPACE_ACCESS_DENIED"; throw error; }
  }
  const startedAt = new Date(); const results = runMissionRiskComputation(request.parameters); const completedAt = new Date();
  const provenance = { entities: datasetVersions.map((version) => ({ type: "Entity", role: "dataset-version", datasetVersionId: String(version._id), rawPayloadHash: version.rawPayloadHash, normalizedPayloadHash: version.normalizedPayloadHash, validationStatus: version.validationStatus })), activity: { type: "Activity", name: "mission-risk-experiment", startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), method: RISK_METHOD }, agent: { type: "Agent", id: "orbitforge-backend", initiatingUser: String(userId) }, relationships: { used: "dataset-version", wasGeneratedBy: "mission-risk-experiment", wasAssociatedWith: String(userId), wasDerivedFrom: "dataset-version" } };
  const runId = new mongoose.Types.ObjectId();
  const payload = buildExperimentSemanticPayload({ datasetVersions, parameters: request.parameters, results, method: RISK_METHOD, type: experiment.type });
  const record = await createResearchArtifact(runId, payload, provenance);
  const reproduction = reproducedFromRun ? { sourceRunId: reproducedFromRun._id, resultMatch: JSON.stringify(reproducedFromRun.results) === JSON.stringify(results), comparedAt: completedAt } : null;
  const run = await ExperimentRun.create({ _id: runId, experimentId: experiment._id, projectId: experiment.projectId, workspaceId, status: "COMPLETED", startedAt, completedAt, datasetVersionIds: request.datasetVersionIds, parameters: request.parameters, missionId: request.missionId || null, method: RISK_METHOD, results, provenance, researchRecordId: record._id, reproducedFromRunId: reproducedFromRun?._id || null, reproduction, createdBy: userId });
  return { run, record };
}

export async function reproduceExperimentRun(run, experiment, userId) {
  if (run.status !== "COMPLETED") { const error = new Error("Only completed experiment runs can be reproduced."); error.code = "EXPERIMENT_RUN_NOT_REPRODUCIBLE"; throw error; }
  if (run.method?.name !== RISK_METHOD.name || run.method?.version !== RISK_METHOD.version || run.method?.type !== RISK_METHOD.type) { const error = new Error("The captured method is not supported for deterministic reproduction."); error.code = "UNSUPPORTED_EXPERIMENT_METHOD"; throw error; }
  return executeExperiment(experiment, run.workspaceId, { datasetVersionIds: run.datasetVersionIds.map(String), parameters: run.parameters, missionId: run.missionId }, userId, { reproducedFromRun: run });
}
