import express from "express";

import {
  createMissionController,
  getMissionsController,
  getMissionByIdController,
  deleteMissionController,
  applyApprovedScenarioController
} from "../controllers/mission.controller.js";
import { validateApplyScenarioBody, validateMissionBody, validateObjectId } from "../middleware/validation.js";

import { requireAuthentication, requireWorkspaceRole, requireMissionWorkspace } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuthentication);

/*
 * =========================================================
 * MISSION CRUD
 * =========================================================
 */

router.post(
  "/workspaces/:workspaceId/missions",
  requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]),
  validateMissionBody,
  createMissionController
);

router.get(
  "/workspaces/:workspaceId/missions",
  requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionsController
);

router.get(
  "/missions/:id",
  validateObjectId("id"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionByIdController
);

router.delete(
  "/missions/:id",
  validateObjectId("id"),
  requireMissionWorkspace(["OWNER", "ADMIN"]),
  deleteMissionController
);

/*
 * =========================================================
 * MISSION DECISION
 * =========================================================
 */

router.post(
  "/missions/:id/apply-approved-scenario",
  validateObjectId("id"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER"]),
  validateApplyScenarioBody,
  applyApprovedScenarioController
);
export default router;
