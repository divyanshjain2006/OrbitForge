import { Router } from "express";

import {
  getAssessmentHistory
} from "../controllers/assessment.controller.js";
import { validateObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = Router();
router.use(requireAuthentication);

router.get(
  "/workspaces/:workspaceId/missions/:missionId/assessments",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getAssessmentHistory
);

export default router;
