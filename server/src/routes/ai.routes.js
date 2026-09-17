import { Router } from "express";
import { analyze } from "../controllers/ai.controller.js";
import { requireAuthentication, requireWorkspaceRole } from "../middleware/auth.js";

const read = ["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]; // Any workspace member can use AI for authorized read context

const router = Router();

// Secure AI route bounded by authentication and workspace membership
router.post(
  "/workspaces/:workspaceId/ai/analyze",
  requireAuthentication,
  requireWorkspaceRole(read),
  analyze
);

export default router;
