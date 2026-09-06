import { Router } from "express";

import {
  getMissionIntelligence
} from "../controllers/intelligence.controller.js";
import { validateObjectId } from "../middleware/validation.js";

const router = Router();

router.get(
  "/:missionId",
  validateObjectId("missionId"),
  getMissionIntelligence
);

export default router;
