import { Router } from "express";

import {
  getAssessmentHistory
} from "../controllers/assessment.controller.js";
import { validateObjectId } from "../middleware/validation.js";

const router = Router();

router.get(
  "/:missionId",
  validateObjectId("missionId"),
  getAssessmentHistory
);

export default router;
