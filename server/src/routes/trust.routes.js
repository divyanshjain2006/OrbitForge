import { Router } from "express";
import { createAnalysisRun, getAnalysisRun, getResearchRecord, listVerifications, verifyRecord } from "../controllers/trust.controller.js";
import { validateAnalysisRunBody, validateTrustObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace, requireTrustResourceWorkspace } from "../middleware/auth.js";

const router = Router();

router.use(requireAuthentication);
router.post("/missions/:missionId/analysis-runs", validateTrustObjectId("missionId", "INVALID_MISSION_ID"), requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER"]), validateAnalysisRunBody, createAnalysisRun);
router.get("/analysis-runs/:id", validateTrustObjectId("id", "INVALID_ANALYSIS_RUN_ID"), requireTrustResourceWorkspace("analysis-run", ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getAnalysisRun);
router.get("/research-records/:id", validateTrustObjectId("id", "INVALID_RESEARCH_RECORD_ID"), requireTrustResourceWorkspace("research-record", ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getResearchRecord);
router.post("/research-records/:id/verify", validateTrustObjectId("id", "INVALID_RESEARCH_RECORD_ID"), requireTrustResourceWorkspace("research-record", ["OWNER", "ADMIN", "RESEARCHER"]), validateAnalysisRunBody, verifyRecord);
router.get("/research-records/:id/verifications", validateTrustObjectId("id", "INVALID_RESEARCH_RECORD_ID"), requireTrustResourceWorkspace("research-record", ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), listVerifications);

export default router;
