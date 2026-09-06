import { Router } from "express";
import { createMembership, createWorkspace, getMemberships, listWorkspaces } from "../controllers/workspace.controller.js";
import { createMissionController, deleteMissionController, getMissionByIdController, getMissionsController } from "../controllers/mission.controller.js";
import { requireAuthentication, requireMissionWorkspace, requireWorkspaceRole } from "../middleware/auth.js";
import { validateMembershipBody, validateMissionBody, validateObjectId, validateWorkspaceBody } from "../middleware/validation.js";

const router = Router();
router.use(requireAuthentication);
router.post("/", validateWorkspaceBody, createWorkspace);
router.get("/", listWorkspaces);
router.post("/:workspaceId/members", requireWorkspaceRole(["OWNER", "ADMIN"]), validateMembershipBody, createMembership);
router.get("/:workspaceId/members", requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getMemberships);
router.post("/:workspaceId/missions", requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), validateMissionBody, createMissionController);
router.get("/:workspaceId/missions", requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getMissionsController);
router.get("/:workspaceId/missions/:id", validateObjectId("id"), requireMissionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getMissionByIdController);
router.delete("/:workspaceId/missions/:id", validateObjectId("id"), requireMissionWorkspace(["OWNER", "ADMIN"]), deleteMissionController);
export default router;
