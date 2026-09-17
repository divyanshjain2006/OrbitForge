import express from "express";
import { getMissionRisk } from "../controllers/risk.controller.js";
import { validateObjectId } from "../middleware/validation.js";
import { requireAuthentication, requireMissionWorkspace } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuthentication);

router.get(
  "/workspaces/:workspaceId/missions/:missionId/risk",
  validateObjectId("missionId"),
  requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]),
  getMissionRisk
);

export default router;
