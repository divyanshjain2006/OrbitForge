import crypto from "node:crypto";
import mongoose from "mongoose";
import Mission from "../models/mission.model.js";
import AnalysisRun from "../models/analysisRun.model.js";
import ResearchRecord from "../models/researchRecord.model.js";
import IntegrityManifest from "../models/integrityManifest.model.js";
import VerificationEvent from "../models/verificationEvent.model.js";
import { calculateOrbitalAnalysis } from "./analysis/orbitalAnalysis.service.js";
import { calculateMissionRisk } from "./risk.service.js";
import { assessSpaceEnvironment } from "./spaceEnvironment/spaceEnvironment.service.js";
import { CANONICALIZATION_VERSION, HASH_ALGORITHM, assertFiniteJson, sha256Digest } from "./integrity.service.js";

const SYSTEM_AGENT = "OrbitForge deterministic analysis service";
const MODEL_VERSIONS = Object.freeze({ orbital: "1.1.0", risk: "2.0.0", environment: "1.0.0" });

function snapshotMission(mission) {
  return { name: mission.name, altitude: Number(mission.altitude), inclination: Number(mission.inclination), duration: Number(mission.duration) };
}

function buildProvenance(inputs, startedAt, completedAt) {
  return {
    entities: [{ id: "mission-configuration", type: "Entity", role: "analytical-input", value: inputs }],
    activity: { type: "Activity", name: "deterministic-mission-analysis", startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), used: ["mission-configuration"] },
    agent: { type: "Agent", id: "orbitforge-backend", name: SYSTEM_AGENT },
    relationships: { wasGeneratedBy: "deterministic-mission-analysis", wasAssociatedWith: "orbitforge-backend", wasDerivedFrom: "mission-configuration" }
  };
}

function semanticPayload({ inputs, outputs, modelVersions, provenance }) {
  return { recordVersion: "1.0", inputs, outputs, modelVersions, provenance };
}

export async function createAnalysisRunForMission(missionId) {
  const mission = await Mission.findById(missionId).lean();
  if (!mission) return null;
  const startedAt = new Date();
  const inputs = snapshotMission(mission);
  try {
    const orbital = calculateOrbitalAnalysis(mission);
    const risk = calculateMissionRisk(mission);
    const environment = assessSpaceEnvironment(mission);
    const completedAt = new Date();
    const outputs = { orbital, risk, environment };
    const provenance = buildProvenance(inputs, startedAt, completedAt);
    const payload = semanticPayload({ inputs, outputs, modelVersions: MODEL_VERSIONS, provenance });
    assertFiniteJson(payload);

    const recordId = new mongoose.Types.ObjectId();
    const manifestId = new mongoose.Types.ObjectId();
    const run = await AnalysisRun.create({ missionId: mission._id, runId: crypto.randomUUID(), status: "COMPLETED", startedAt, completedAt, inputs, outputs, modelVersions: MODEL_VERSIONS, provenance, researchRecordId: recordId });
    const digest = sha256Digest(payload);
    try {
      await IntegrityManifest.create({ _id: manifestId, researchRecordId: recordId, algorithm: HASH_ALGORITHM, canonicalizationVersion: CANONICALIZATION_VERSION, digest, createdBy: SYSTEM_AGENT });
      const researchRecord = await ResearchRecord.create({ _id: recordId, missionId: mission._id, analysisRunId: run._id, recordVersion: "1.0", semanticPayload: payload, canonicalizationVersion: CANONICALIZATION_VERSION, integrityManifestId: manifestId, provenance });
      return { run, researchRecord, manifest: await IntegrityManifest.findById(manifestId).lean() };
    } catch (error) {
      await IntegrityManifest.deleteOne({ _id: manifestId });
      await AnalysisRun.findByIdAndUpdate(run._id, { status: "FAILED" });
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

export async function verifyResearchRecord(recordId) {
  const record = await ResearchRecord.findById(recordId).lean();
  if (!record) return null;
  const manifest = await IntegrityManifest.findById(record.integrityManifestId).lean();
  if (!manifest) {
    const error = new Error("Research record has no integrity manifest."); error.code = "RECORD_NOT_VERIFIABLE"; throw error;
  }
  let computedHash;
  try { computedHash = sha256Digest(record.semanticPayload); }
  catch (cause) { const error = new Error("Research record payload cannot be canonicalized."); error.code = "CANONICALIZATION_ERROR"; error.cause = cause; throw error; }
  const result = computedHash === manifest.digest ? "VERIFIED" : "FAILED";
  const event = await VerificationEvent.create({ researchRecordId: record._id, verifiedAt: new Date(), result, expectedHash: manifest.digest, computedHash, canonicalizationVersion: manifest.canonicalizationVersion, algorithm: manifest.algorithm, verifier: SYSTEM_AGENT });
  return { record, manifest, event };
}

export async function getResearchRecordWithManifest(id) {
  const record = await ResearchRecord.findById(id).lean();
  if (!record) return null;
  const manifest = await IntegrityManifest.findById(record.integrityManifestId).lean();
  return { record, manifest };
}

export function getVerificationEvents(recordId) {
  return VerificationEvent.find({ researchRecordId: recordId }).sort({ verifiedAt: -1 }).lean();
}
