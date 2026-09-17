import { Router } from "express";

import {
  getMissionIntelligence
} from "../controllers/intelligence.controller.js";
import { validateObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = Router();
router.use(requireAuthentication);

router.get(
  "/workspaces/:workspaceId/missions/:missionId/intelligence",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionIntelligence
);

export default router;
