import mongoose from "mongoose";
import User from "../models/user.model.js";
import Mission from "../models/mission.model.js";
import AnalysisRun from "../models/analysisRun.model.js";
import ResearchRecord from "../models/researchRecord.model.js";
import Dataset from "../models/dataset.model.js";
import DatasetVersion from "../models/datasetVersion.model.js";
import Project from "../models/project.model.js";
import Experiment from "../models/experiment.model.js";
import ExperimentRun from "../models/experimentRun.model.js";
import { verifyToken } from "../services/auth.service.js";
import { findMembership } from "../services/workspace.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

function reject(res, status, code, message) { return res.status(status).json({ success: false, error: { code, message } }); }
export function hasWorkspaceRole(membership, roles = []) { return Boolean(membership) && (!roles.length || roles.includes(membership.role)); }

export async function requireAuthentication(req, res, next) {
  const header = req.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return reject(res, 401, "AUTHENTICATION_REQUIRED", "A bearer token is required.");
  try {
    const claims = verifyToken(match[1]);
    if (!mongoose.isObjectIdOrHexString(claims.sub)) throw new Error("Invalid token subject.");
    const user = await User.findById(claims.sub).lean();
    if (!user) return reject(res, 401, "INVALID_TOKEN", "Authentication token is no longer valid.");
    req.auth = { userId: String(user._id), user };
    return next();
  } catch (error) {
    return reject(res, 401, "INVALID_TOKEN", "Authentication token is invalid or expired.");
  }
}

export function requireWorkspaceRole(roles = []) {
  return async (req, res, next) => {
    const workspaceId = req.params.workspaceId || req.workspaceId;
    if (!mongoose.isObjectIdOrHexString(workspaceId)) return reject(res, 400, "INVALID_WORKSPACE_ID", "Invalid workspace ID.");
    const membership = await findMembership(req.auth.userId, workspaceId);
    if (!hasWorkspaceRole(membership, roles)) {
      void recordAuditEvent({ action: "WORKSPACE_ACCESS", outcome: "DENIED", actorId: req.auth.userId, workspaceId: mongoose.isObjectIdOrHexString(workspaceId) ? workspaceId : null, requestId: req.requestId, detail: "Membership or role check failed." });
      return reject(res, 403, "WORKSPACE_ACCESS_DENIED", "You do not have permission for this workspace resource.");
    }
    req.workspaceId = String(workspaceId);
    req.membership = membership;
    return next();
  };
}

export function requireMissionWorkspace(roles) {
  return async (req, res, next) => {
    const mission = await Mission.findById(req.params.missionId || req.params.id).lean();
    if (!mission || !mission.workspaceId) return reject(res, 404, "RESOURCE_NOT_FOUND", "Mission not found.");
    if (req.params.workspaceId && String(mission.workspaceId) !== String(req.params.workspaceId)) return reject(res, 404, "RESOURCE_NOT_FOUND", "Mission not found.");
    req.workspaceId = String(mission.workspaceId);
    req.mission = mission;
    return requireWorkspaceRole(roles)(req, res, next);
  };
}

export function requireTrustResourceWorkspace(resource, roles) {
  const Model = resource === "analysis-run" ? AnalysisRun : ResearchRecord;
  return async (req, res, next) => {
    const item = await Model.findById(req.params.id).lean();
    if (!item) return reject(res, 404, "RESOURCE_NOT_FOUND", `${resource} not found.`);
    if (item.artifactType === "EXPERIMENT_RUN") {
      const run = await ExperimentRun.findById(item.experimentRunId).lean();
      if (!run?.workspaceId) return reject(res, 404, "RESOURCE_NOT_FOUND", "Resource not found.");
      req.workspaceId = String(run.workspaceId);
    } else {
      const mission = await Mission.findById(item.missionId).lean();
      if (!mission?.workspaceId) return reject(res, 404, "RESOURCE_NOT_FOUND", "Resource not found.");
      req.workspaceId = String(mission.workspaceId);
    }
    req[resource === "analysis-run" ? "analysisRun" : "researchRecord"] = item;
    return requireWorkspaceRole(roles)(req, res, next);
  };
}

export function requireDatasetWorkspace(roles) {
  return async (req, res, next) => {
    const dataset = await Dataset.findById(req.params.id).lean();
    if (!dataset) return reject(res, 404, "RESOURCE_NOT_FOUND", "Dataset not found.");
    req.dataset = dataset; req.workspaceId = String(dataset.workspaceId);
    return requireWorkspaceRole(roles)(req, res, next);
  };
}

export function requireDatasetVersionWorkspace(roles) {
  return async (req, res, next) => {
    const datasetVersion = await DatasetVersion.findById(req.params.id).lean();
    if (!datasetVersion) return reject(res, 404, "RESOURCE_NOT_FOUND", "Dataset version not found.");
    const dataset = await Dataset.findById(datasetVersion.datasetId).lean();
    if (!dataset) return reject(res, 404, "RESOURCE_NOT_FOUND", "Dataset version not found.");
    req.datasetVersion = datasetVersion; req.dataset = dataset; req.workspaceId = String(dataset.workspaceId);
    return requireWorkspaceRole(roles)(req, res, next);
  };
}

export function requireProjectWorkspace(roles, parameter = "id") {
  return async (req, res, next) => {
    const project = await Project.findById(req.params[parameter]).lean();
    if (!project) return reject(res, 404, "PROJECT_NOT_FOUND", "Project not found.");
    req.project = project; req.workspaceId = String(project.workspaceId);
    return requireWorkspaceRole(roles)(req, res, next);
  };
}
export function requireExperimentWorkspace(roles) {
  return async (req, res, next) => {
    const experiment = await Experiment.findById(req.params.id).lean();
    if (!experiment) return reject(res, 404, "EXPERIMENT_NOT_FOUND", "Experiment not found.");
    const project = await Project.findById(experiment.projectId).lean();
    if (!project || String(project.workspaceId) !== String(experiment.workspaceId)) return reject(res, 404, "EXPERIMENT_NOT_FOUND", "Experiment not found.");
    req.experiment = experiment; req.project = project; req.workspaceId = String(project.workspaceId);
    return requireWorkspaceRole(roles)(req, res, next);
  };
}
export function requireExperimentRunWorkspace(roles) {
  return async (req, res, next) => {
    const run = await ExperimentRun.findById(req.params.id).lean();
    if (!run) return reject(res, 404, "EXPERIMENT_RUN_NOT_FOUND", "Experiment run not found.");
    const experiment = await Experiment.findById(run.experimentId).lean();
    if (!experiment || String(experiment.workspaceId) !== String(run.workspaceId)) return reject(res, 404, "EXPERIMENT_RUN_NOT_FOUND", "Experiment run not found.");
    const project = await Project.findById(run.projectId).lean();
    if (!project || String(project.workspaceId) !== String(run.workspaceId) || String(experiment.projectId) !== String(project._id)) return reject(res, 404, "EXPERIMENT_RUN_NOT_FOUND", "Experiment run not found.");
    req.experimentRun = run; req.experiment = experiment; req.workspaceId = String(run.workspaceId);
    return requireWorkspaceRole(roles)(req, res, next);
  };
}
