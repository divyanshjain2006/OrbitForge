import express from "express";
import { requireAuthentication } from "../middleware/auth.js";
import { requireWorkspaceMember } from "../middleware/workspace.js";
import {
  getCatalogController,
  createChallengeController,
  getMissionChallengesController,
  getChallengeController,
  startChallengeController,
  submitChallengeDecisionController
} from "../controllers/challenge.controller.js";

const router = express.Router();

router.use(requireAuthentication);

router.get("/catalog", getCatalogController);

router.get("/missions/:missionId", requireWorkspaceMember, getMissionChallengesController);
router.post("/missions/:missionId", requireWorkspaceMember, createChallengeController);

router.get("/:id", requireWorkspaceMember, getChallengeController);
router.post("/:id/start", requireWorkspaceMember, startChallengeController);
router.post("/:id/decisions", requireWorkspaceMember, submitChallengeDecisionController);

export default router;
