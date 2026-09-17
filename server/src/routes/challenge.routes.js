import express from "express";
import { requireAuthentication, requireWorkspaceRole } from "../middleware/auth.js";
import { requireWorkspaceMember } from "../middleware/workspace.js";
import {
  getCatalogController,
  createChallengeController,
  getMissionChallengesController,
  getChallengeController,
  startChallengeController,
  submitChallengeDecisionController,
  publishChallengeController
} from "../controllers/challenge.controller.js";

const router = express.Router();

router.use(requireAuthentication);

router.get("/catalog", getCatalogController);

router.get("/missions/:missionId", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getMissionChallengesController);
router.post("/missions/:missionId", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), createChallengeController);

router.get("/:id", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getChallengeController);
router.post("/:id/start", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), startChallengeController);
router.post("/:id/decisions", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), submitChallengeDecisionController);
router.post("/:id/research", requireWorkspaceMember, requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), publishChallengeController);

export default router;
