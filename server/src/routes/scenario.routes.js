import express from "express";

import {
  analyzeScenario
} from "../controllers/scenario.controller.js";
import { validateObjectId, validateScenarioBody } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuthentication);

router.post(
  "/workspaces/:workspaceId/missions/:missionId/scenario",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER"]),
  validateScenarioBody,
  analyzeScenario
);

export default router;
