import Project from "../models/project.model.js";
import Experiment from "../models/experiment.model.js";
import ExperimentRun from "../models/experimentRun.model.js";
import Dataset from "../models/dataset.model.js";
import DatasetVersion from "../models/datasetVersion.model.js";
import Mission from "../models/mission.model.js";
import ResearchRecord from "../models/researchRecord.model.js";
import IntegrityManifest from "../models/integrityManifest.model.js";
import VerificationEvent from "../models/verificationEvent.model.js";
import Workspace from "../models/workspace.model.js";

const MAX_LIMIT = 50;
const TYPES = new Set(["PROJECT", "DATASET", "EXPERIMENT", "EXPERIMENT_RUN", "RESEARCH_RECORD", "MISSION"]);
export function parseResearchQuery(query = {}) {
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw Object.assign(new Error("limit must be an integer from 1 to 50."), { code: "INVALID_RESEARCH_FILTER" });
  if (query.type && !TYPES.has(query.type)) throw Object.assign(new Error("Unsupported research resource type."), { code: "INVALID_RESEARCH_FILTER" });
  if (query.status && typeof query.status !== "string") throw Object.assign(new Error("Invalid status filter."), { code: "INVALID_RESEARCH_FILTER" });
  let cursor = null;
  if (query.cursor) { try { cursor = JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8")); if (!cursor?.createdAt || !cursor?.id) throw new Error(); } catch { throw Object.assign(new Error("Invalid cursor."), { code: "INVALID_CURSOR" }); } }
  return { q: typeof query.q === "string" ? query.q.trim().slice(0, 120) : "", type: query.type || null, status: query.status || null, projectId: query.projectId || null, limit, cursor };
}
function integrityMap(records, manifests, events) {
  const manifestById = new Map(manifests.map((manifest) => [String(manifest._id), manifest]));
  const latest = new Map();
  for (const event of events) if (!latest.has(String(event.researchRecordId))) latest.set(String(event.researchRecordId), event);
  return new Map(records.map((record) => { const manifest = manifestById.get(String(record.integrityManifestId)); const event = latest.get(String(record._id)); return [String(record._id), { status: event?.result || (manifest ? "NOT_VERIFIED" : "UNAVAILABLE"), algorithm: manifest?.algorithm || null, digest: manifest?.digest || null, lastVerifiedAt: event?.verifiedAt || null, verificationEventId: event?._id || null }]; }));
}
export async function researchIntegrity(records) {
  const ids = records.map((record) => record._id); const manifests = await IntegrityManifest.find({ _id: { $in: records.map((record) => record.integrityManifestId).filter(Boolean) } }).lean(); const events = await VerificationEvent.find({ researchRecordId: { $in: ids } }).sort({ verifiedAt: -1 }).lean(); return integrityMap(records, manifests, events);
}
export async function workspaceOverview(workspaceId) {
  const [workspace, projectTotal, projectActive, projectArchived, datasetTotal, datasetIds, experimentTotal, experimentActive, experimentCompleted, experimentIds, runTotal, runCompleted, runFailed, experimentRuns] = await Promise.all([
    Workspace.findById(workspaceId).select("name ownerId createdAt").lean(), Project.countDocuments({ workspaceId }), Project.countDocuments({ workspaceId, status: "ACTIVE" }), Project.countDocuments({ workspaceId, status: "ARCHIVED" }), Dataset.countDocuments({ workspaceId }), Dataset.find({ workspaceId }).distinct("_id"), Experiment.countDocuments({ workspaceId }), Experiment.countDocuments({ workspaceId, status: "ACTIVE" }), Experiment.countDocuments({ workspaceId, status: "COMPLETED" }), Experiment.find({ workspaceId }).distinct("_id"), ExperimentRun.countDocuments({ workspaceId }), ExperimentRun.countDocuments({ workspaceId, status: "COMPLETED" }), ExperimentRun.countDocuments({ workspaceId, status: "FAILED" }), ExperimentRun.find({ workspaceId }).select("researchRecordId").lean()
  ]);
  const [versions, records] = await Promise.all([DatasetVersion.countDocuments({ datasetId: { $in: datasetIds } }), ResearchRecord.find({ $or: [{ experimentRunId: { $in: experimentRuns.map((run) => run._id) } }, { missionId: { $in: await Mission.find({ workspaceId }).distinct("_id") } }] }).select("_id integrityManifestId").lean()]);
  const integrity = await researchIntegrity(records); const states = [...integrity.values()];
  return { workspace, projects: { total: projectTotal, active: projectActive, archived: projectArchived }, datasets: { total: datasetTotal, versions }, experiments: { total: experimentTotal, active: experimentActive, completed: experimentCompleted }, experimentRuns: { total: runTotal, completed: runCompleted, failed: runFailed }, researchRecords: { total: records.length, verified: states.filter((item) => item.status === "VERIFIED").length, notVerified: states.filter((item) => item.status === "NOT_VERIFIED").length, failed: states.filter((item) => item.status === "FAILED").length } };
}
export async function projectResearch(project) {
  const [experiments, missions, datasets, runs] = await Promise.all([Experiment.find({ projectId: project._id }).select("name status type createdAt").lean(), Mission.find({ workspaceId: project.workspaceId }).select("name altitude inclination duration createdAt").limit(20).lean(), Dataset.find({ workspaceId: project.workspaceId }).select("name source datasetType status createdAt").limit(20).lean(), ExperimentRun.find({ projectId: project._id }).sort({ createdAt: -1 }).limit(10).select("experimentId status researchRecordId createdAt completedAt").lean()]);
  const records = await ResearchRecord.find({ experimentRunId: { $in: runs.map((run) => run._id) } }).select("_id integrityManifestId").lean(); const integrity = await researchIntegrity(records);
  const recentExperimentRuns = runs.map((run) => ({
    ...run,
    integrity: integrity.get(String(run.researchRecordId)) || { status: "UNAVAILABLE" }
  }));
  return { project, experiments, missions, datasets, recentExperimentRuns, researchRecords: { total: records.length, integrity: Object.fromEntries([...integrity]) } };
}
export async function experimentResearch(experiment, project) {
  const runs = await ExperimentRun.find({ experimentId: experiment._id }).sort({ createdAt: -1 }).limit(20).lean(); const records = await ResearchRecord.find({ experimentRunId: { $in: runs.map((run) => run._id) } }).select("_id integrityManifestId").lean(); const integrity = await researchIntegrity(records);
  const versionIds = [...new Set(runs.flatMap((run) => run.datasetVersionIds.map(String)))]; const versions = await DatasetVersion.find({ _id: { $in: versionIds } }).select("datasetId version normalizedPayloadHash validationStatus").lean();
  const [total, completed, failed] = await Promise.all([
    ExperimentRun.countDocuments({ experimentId: experiment._id }),
    ExperimentRun.countDocuments({ experimentId: experiment._id, status: "COMPLETED" }),
    ExperimentRun.countDocuments({ experimentId: experiment._id, status: "FAILED" })
  ]);
  const latestRuns = runs.map((run) => ({
    ...run,
    integrity: integrity.get(String(run.researchRecordId)) || { status: "UNAVAILABLE" }
  }));
  return { experiment, project: { id: project._id, name: project.name, status: project.status }, runSummary: { total, completed, failed }, datasetVersions: versions, latestRuns };
}
export async function recordProvenance(record) { return { researchRecordId: record._id, artifactType: record.artifactType, provenance: record.provenance, semanticPayload: record.semanticPayload }; }
export async function searchWorkspace(workspaceId, filters) {
  const pattern = filters.q ? new RegExp(filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null; const matchText = pattern ? { $or: [{ name: pattern }, { description: pattern }] } : {};
  const [projects, datasets, experiments, runs, missions] = await Promise.all([
    (!filters.type || filters.type === "PROJECT") ? Project.find({ workspaceId, ...matchText, ...(filters.status ? { status: filters.status } : {}) }).lean() : [],
    (!filters.type || filters.type === "DATASET") ? Dataset.find({ workspaceId, ...matchText, ...(filters.status ? { status: filters.status } : {}) }).lean() : [],
    (!filters.type || filters.type === "EXPERIMENT") ? Experiment.find({ workspaceId, ...matchText, ...(filters.status ? { status: filters.status } : {}), ...(filters.projectId ? { projectId: filters.projectId } : {}) }).lean() : [],
    (!filters.type || filters.type === "EXPERIMENT_RUN") ? ExperimentRun.find({ workspaceId, ...(filters.status ? { status: filters.status } : {}), ...(filters.projectId ? { projectId: filters.projectId } : {}) }).lean() : [],
    (!filters.type || filters.type === "MISSION") ? Mission.find({ workspaceId, ...(pattern ? { name: pattern } : {}) }).lean() : []
  ]);
  const records = (!filters.type || filters.type === "RESEARCH_RECORD") ? await ResearchRecord.find({ experimentRunId: { $in: (await ExperimentRun.find({ workspaceId }).select("_id").lean()).map((run) => run._id) }, ...(filters.status ? {} : {}) }).select("artifactType experimentRunId createdAt integrityManifestId").lean() : [];
  const integrity = await researchIntegrity(records);
  let resources = [...projects.map((item) => ({ id: item._id, type: "PROJECT", name: item.name, status: item.status, createdAt: item.createdAt })), ...datasets.map((item) => ({ id: item._id, type: "DATASET", name: item.name, status: item.status, createdAt: item.createdAt })), ...experiments.map((item) => ({ id: item._id, type: "EXPERIMENT", name: item.name, status: item.status, projectId: item.projectId, createdAt: item.createdAt })), ...runs.map((item) => ({ id: item._id, type: "EXPERIMENT_RUN", name: "Experiment run", status: item.status, projectId: item.projectId, createdAt: item.createdAt })), ...records.filter((item) => !filters.status || integrity.get(String(item._id))?.status === filters.status).map((item) => ({ id: item._id, type: "RESEARCH_RECORD", name: `${item.artifactType} research record`, status: integrity.get(String(item._id))?.status, createdAt: item.createdAt })), ...missions.map((item) => ({ id: item._id, type: "MISSION", name: item.name, status: item.decision?.status, createdAt: item.createdAt }))];
  resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || String(b.id).localeCompare(String(a.id)));
  if (filters.cursor) resources = resources.filter((item) => new Date(item.createdAt) < new Date(filters.cursor.createdAt) || (new Date(item.createdAt).getTime() === new Date(filters.cursor.createdAt).getTime() && String(item.id) < filters.cursor.id));
  const page = resources.slice(0, filters.limit); const tail = page.at(-1); return { resources: page, nextCursor: tail && resources.length > page.length ? Buffer.from(JSON.stringify({ createdAt: tail.createdAt, id: String(tail.id) })).toString("base64url") : null };
}
