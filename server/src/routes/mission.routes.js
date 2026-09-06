import express from "express";

import {
  createMissionController,
  getMissionsController,
  getMissionByIdController,
  deleteMissionController,
  applyApprovedScenarioController
} from "../controllers/mission.controller.js";
import { validateApplyScenarioBody, validateMissionBody, validateObjectId } from "../middleware/validation.js";

const router = express.Router();

/*
 * =========================================================
 * MISSION CRUD
 * =========================================================
 */

router.post(
  "/",
  validateMissionBody,
  createMissionController
);

router.get(
  "/",
  getMissionsController
);

router.get(
  "/:id",
  validateObjectId("id"),
  getMissionByIdController
);

router.delete(
  "/:id",
  validateObjectId("id"),
  deleteMissionController
);

/*
 * =========================================================
 * MISSION DECISION
 * =========================================================
 */

router.post(
  "/:id/apply-approved-scenario",
  validateObjectId("id"),
  validateApplyScenarioBody,
  applyApprovedScenarioController
);
export default router;
