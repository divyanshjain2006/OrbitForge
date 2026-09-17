import express from "express";
import {
  createSimulationHandler,
  getSimulationHandler,
  listMissionSimulationsHandler,
  triggerSimulationEventHandler,
  submitSimulationDecisionHandler,
  publishSimulationHandler
} from "../controllers/simulation.controller.js";
import {
  validateObjectId,
  validateSimulationEventBody,
  validateSimulationDecisionBody
} from "../middleware/validation.js";
import { requireAuthentication, requireWorkspaceRole } from "../middleware/auth.js";
import { requireWorkspaceMember } from "../middleware/workspace.js";

const router = express.Router();

router.use(requireAuthentication, requireWorkspaceMember);

router.post("/missions/:missionId/simulations", validateObjectId("missionId"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), createSimulationHandler);
router.get("/missions/:missionId/simulations", validateObjectId("missionId"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), listMissionSimulationsHandler);
router.get("/simulations/:id", validateObjectId("id"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getSimulationHandler);
router.post("/simulations/:id/events", validateObjectId("id"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), validateSimulationEventBody, triggerSimulationEventHandler);
router.post("/simulations/:id/decisions", validateObjectId("id"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), validateSimulationDecisionBody, submitSimulationDecisionHandler);
router.post("/simulations/:id/research", validateObjectId("id"), requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), publishSimulationHandler);

export default router;
