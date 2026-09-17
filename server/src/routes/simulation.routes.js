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
import { requireAuthentication } from "../middleware/auth.js";
import { requireWorkspaceMember } from "../middleware/workspace.js";

const router = express.Router();

router.use(requireAuthentication, requireWorkspaceMember);

router.post("/missions/:missionId/simulations", validateObjectId("missionId"), createSimulationHandler);
router.get("/missions/:missionId/simulations", validateObjectId("missionId"), listMissionSimulationsHandler);
router.get("/simulations/:id", validateObjectId("id"), getSimulationHandler);
router.post("/simulations/:id/events", validateObjectId("id"), validateSimulationEventBody, triggerSimulationEventHandler);
router.post("/simulations/:id/decisions", validateObjectId("id"), validateSimulationDecisionBody, submitSimulationDecisionHandler);
router.post("/simulations/:id/research", validateObjectId("id"), publishSimulationHandler);

export default router;
