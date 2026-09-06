import express from "express";

import {
  analyzeScenario
} from "../controllers/scenario.controller.js";
import { validateObjectId, validateScenarioBody } from "../middleware/validation.js";

const router = express.Router();

router.post(
  "/:missionId",
  validateObjectId("missionId"),
  validateScenarioBody,
  analyzeScenario
);

export default router;
