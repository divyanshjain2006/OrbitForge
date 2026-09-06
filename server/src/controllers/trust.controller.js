import AnalysisRun from "../models/analysisRun.model.js";
import { createAnalysisRunForMission, getResearchRecordWithManifest, getVerificationEvents, verifyResearchRecord } from "../services/analysisRun.service.js";
import { recordAuditEvent } from "../services/audit.service.js";
import VerificationEvent from "../models/verificationEvent.model.js";

function failure(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

export async function createAnalysisRun(req, res) {
  try {
    const result = await createAnalysisRunForMission(req.params.missionId);
    if (!result) return failure(res, 404, "RESOURCE_NOT_FOUND", "Mission not found.");
    void recordAuditEvent({ action: "ANALYSIS_RUN_CREATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "AnalysisRun", resourceId: String(result.run._id), requestId: req.requestId });
    return res.status(201).json({ success: true, analysisRun: result.run, researchRecord: result.researchRecord, integrityManifest: result.manifest });
  } catch (error) {
    console.error("Analysis run creation failed:", error.message);
    return failure(res, 500, "INTERNAL_ERROR", "Unable to create analysis run.");
  }
}

export async function getAnalysisRun(req, res) {
  try {
    const analysisRun = await AnalysisRun.findById(req.params.id).lean();
    if (!analysisRun) return failure(res, 404, "RESOURCE_NOT_FOUND", "Analysis run not found.");
    return res.json({ success: true, analysisRun });
  } catch (error) {
    return failure(res, 500, "INTERNAL_ERROR", "Unable to retrieve analysis run.");
  }
}

export async function getResearchRecord(req, res) {
  try {
    const result = await getResearchRecordWithManifest(req.params.id);
    if (!result) return failure(res, 404, "RESOURCE_NOT_FOUND", "Research record not found.");
    const verification = await VerificationEvent.findOne({ researchRecordId: result.record._id }).sort({ verifiedAt: -1 }).lean();
    const integrity = { status: verification?.result || (result.manifest ? "NOT_VERIFIED" : "UNAVAILABLE"), algorithm: result.manifest?.algorithm || null, digest: result.manifest?.digest || null, lastVerifiedAt: verification?.verifiedAt || null, verificationEventId: verification?._id || null };
    return res.json({ success: true, researchRecord: result.record, integrityManifest: result.manifest, integrity });
  } catch (error) {
    return failure(res, 500, "INTERNAL_ERROR", "Unable to retrieve research record.");
  }
}

export async function verifyRecord(req, res) {
  try {
    const result = await verifyResearchRecord(req.params.id);
    if (!result) return failure(res, 404, "RESOURCE_NOT_FOUND", "Research record not found.");
    void recordAuditEvent({ action: "RESEARCH_RECORD_VERIFY", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "ResearchRecord", resourceId: req.params.id, requestId: req.requestId });
    return res.json({ success: true, verification: result.event, integrityManifest: result.manifest });
  } catch (error) {
    const code = error.code || "INTERNAL_ERROR";
    const status = code === "RECORD_NOT_VERIFIABLE" ? 409 : code === "CANONICALIZATION_ERROR" ? 422 : 500;
    return failure(res, status, code, error.message);
  }
}

export async function listVerifications(req, res) {
  try {
    const result = await getResearchRecordWithManifest(req.params.id);
    if (!result) return failure(res, 404, "RESOURCE_NOT_FOUND", "Research record not found.");
    const verifications = await getVerificationEvents(req.params.id);
    return res.json({ success: true, verifications });
  } catch (error) {
    return failure(res, 500, "INTERNAL_ERROR", "Unable to retrieve verification events.");
  }
}
