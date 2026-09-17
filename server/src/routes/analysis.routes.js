import { Router } from "express";
import { getMissionAnalysis } from "../controllers/analysis.controller.js";
import { validateObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = Router();
router.use(requireAuthentication);

router.get(
  "/workspaces/:workspaceId/missions/:missionId/analysis",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionAnalysis
);

export default router;
