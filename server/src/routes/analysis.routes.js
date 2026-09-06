import { Router } from "express";

import {
  getMissionAnalysis
} from "../controllers/analysis.controller.js";
import { validateObjectId } from "../middleware/validation.js";

const router = Router();

router.get(
  "/:missionId",
  validateObjectId("missionId"),
  getMissionAnalysis
);

export default router;
