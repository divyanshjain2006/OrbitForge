import express from "express";
import { getMissionRisk } from "../controllers/risk.controller.js";
import { validateObjectId } from "../middleware/validation.js";

const router = express.Router();

router.get(
  "/missions/:missionId/risk",
  validateObjectId("missionId"),
  getMissionRisk
);

export default router;
