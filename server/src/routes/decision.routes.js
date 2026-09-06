import { Router } from "express";

import {
  createDecision,
  getMissionDecisions
} from "../controllers/decision.controller.js";
import { validateDecisionBody, validateObjectId } from "../middleware/validation.js";

const router = Router();

router.get(
  "/:missionId",
  validateObjectId("missionId"),
  getMissionDecisions
);

router.post(
  "/:missionId",
  validateObjectId("missionId"),
  validateDecisionBody,
  createDecision
);

export default router;
