import { createDataset, getDataset, getDatasetVersion, ingestScoutDataset, listDatasetVersions, listDatasets, listValidationRuns } from "../services/dataset.service.js";
import { validateDatasetVersion } from "../services/datasetValidation.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

function fail(res, status, code, message) { return res.status(status).json({ success: false, error: { code, message } }); }
export async function createDatasetController(req, res) {
  try { const dataset = await createDataset({ ...req.body, workspaceId: req.workspaceId, createdBy: req.auth.userId }); void recordAuditEvent({ action: "DATASET_CREATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "Dataset", resourceId: String(dataset._id), requestId: req.requestId }); return res.status(201).json({ success: true, dataset }); }
  catch { return fail(res, 400, "DATASET_CREATE_FAILED", "Unable to create dataset."); }
}
export async function listDatasetsController(req, res) { return res.json({ success: true, datasets: await listDatasets(req.workspaceId) }); }
export async function getDatasetController(req, res) { const dataset = req.dataset || await getDataset(req.params.id); return dataset ? res.json({ success: true, dataset }) : fail(res, 404, "RESOURCE_NOT_FOUND", "Dataset not found."); }
export async function ingestDataset(req, res) {
  try { const result = await ingestScoutDataset(req.dataset, req.auth.userId); void recordAuditEvent({ action: "DATASET_INGEST", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "DatasetVersion", resourceId: String(result.version._id), requestId: req.requestId }); return res.status(201).json({ success: true, datasetVersion: result.version, validationRun: result.validationRun }); }
  catch (error) { return fail(res, error.code === "INGESTION_RATE_LIMITED" ? 429 : 502, error.code || "INGESTION_FAILED", "Unable to ingest CNEOS Scout data."); }
}
export async function listVersions(req, res) { return res.json({ success: true, versions: await listDatasetVersions(req.dataset._id) }); }
export async function getVersion(req, res) { return res.json({ success: true, datasetVersion: req.datasetVersion || await getDatasetVersion(req.params.id) }); }
export async function validateVersion(req, res) {
  try { const validationRun = await validateDatasetVersion(req.datasetVersion, req.auth.userId); void recordAuditEvent({ action: "DATASET_VERSION_VALIDATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "DatasetVersion", resourceId: req.params.id, requestId: req.requestId }); return res.status(201).json({ success: true, validationRun }); }
  catch { return fail(res, 500, "VALIDATION_FAILED", "Unable to validate dataset version."); }
}
export async function listValidations(req, res) { return res.json({ success: true, validationRuns: await listValidationRuns(req.datasetVersion._id) }); }
