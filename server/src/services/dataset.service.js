import Dataset from "../models/dataset.model.js";
import DatasetVersion from "../models/datasetVersion.model.js";
import ValidationRun from "../models/validationRun.model.js";
import { CANONICALIZATION_VERSION, sha256Digest } from "./integrity.service.js";
import { retrieveScoutPayload } from "./nasa/scout.service.js";
import { validateDatasetVersion } from "./datasetValidation.service.js";

const recentIngestions = new Map();
const INGESTION_COOLDOWN_MS = 30000;

export function createDataset(input) {
  return Dataset.create({ ...input, source: "CNEOS_SCOUT", sourceType: "NASA_API", sourceUri: "https://cneos.jpl.nasa.gov/scout.api", datasetType: "NEO_HAZARD_ASSESSMENT" });
}
export function listDatasets(workspaceId) { return Dataset.find({ workspaceId }).sort({ createdAt: -1 }).lean(); }
export function getDataset(id) { return Dataset.findById(id).lean(); }
export function listDatasetVersions(datasetId) { return DatasetVersion.find({ datasetId }).sort({ version: -1 }).lean(); }
export function getDatasetVersion(id) { return DatasetVersion.findById(id).lean(); }
export function listValidationRuns(datasetVersionId) { return ValidationRun.find({ datasetVersionId }).sort({ executedAt: -1 }).lean(); }

export async function ingestScoutDataset(dataset, createdBy, { fetcher } = {}) {
  const lastIngestion = recentIngestions.get(String(dataset._id));
  if (lastIngestion && Date.now() - lastIngestion < INGESTION_COOLDOWN_MS) {
    const error = new Error("Please wait before requesting another Scout ingestion for this dataset."); error.code = "INGESTION_RATE_LIMITED"; throw error;
  }
  recentIngestions.set(String(dataset._id), Date.now());
  const retrieved = await retrieveScoutPayload({ fetcher });
  const latest = await DatasetVersion.findOne({ datasetId: dataset._id }).sort({ version: -1 }).lean();
  const version = await DatasetVersion.create({
    datasetId: dataset._id,
    version: (latest?.version || 0) + 1,
    sourceUri: retrieved.sourceUri,
    retrievedAt: retrieved.retrievedAt,
    rawPayload: retrieved.rawPayload,
    rawPayloadHash: sha256Digest(retrieved.rawPayload),
    normalizedPayload: retrieved.normalizedPayload,
    normalizedPayloadHash: sha256Digest(retrieved.normalizedPayload),
    canonicalizationVersion: CANONICALIZATION_VERSION,
    provenance: {
      entities: [{ id: "cneos-scout-response", type: "Entity", sourceUri: retrieved.sourceUri }],
      activity: { type: "Activity", name: "cneos-scout-ingestion", retrievedAt: retrieved.retrievedAt.toISOString(), adapterVersion: retrieved.adapterVersion },
      agent: { type: "Agent", id: "orbitforge-backend", typeLabel: "system" },
      relationships: { wasGeneratedBy: "cneos-scout-ingestion", wasAssociatedWith: String(createdBy), wasDerivedFrom: "cneos-scout-response" }
    },
    ingestionVersion: retrieved.adapterVersion,
    createdBy
  });
  const validationRun = await validateDatasetVersion(version, createdBy);
  return { version, validationRun };
}
