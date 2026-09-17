import { Router } from "express";

import {
  createDecision,
  getMissionDecisions
} from "../controllers/decision.controller.js";
import { validateDecisionBody, validateObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = Router();
router.use(requireAuthentication);

router.get(
  "/workspaces/:workspaceId/missions/:missionId/decisions",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionDecisions
);

router.post(
  "/workspaces/:workspaceId/missions/:missionId/decisions",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER"]),
  validateDecisionBody,
  createDecision
);

export default router;
