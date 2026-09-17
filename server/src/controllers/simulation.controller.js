import {
  createSimulation,
  getSimulation,
  getMissionSimulations,
  triggerSimulationEvent,
  submitSimulationDecision
} from "../services/simulation.service.js";

export async function createSimulationHandler(req, res, next) {
  try {
    const simulation = await createSimulation(req.workspace.id, req.params.missionId);
    return res.status(201).json({ success: true, simulation });
  } catch (error) {
    return next(error);
  }
}

export async function getSimulationHandler(req, res, next) {
  try {
    const simulation = await getSimulation(req.workspace.id, req.params.id);
    return res.json({ success: true, simulation });
  } catch (error) {
    return next(error);
  }
}

export async function listMissionSimulationsHandler(req, res, next) {
  try {
    const simulations = await getMissionSimulations(req.workspace.id, req.params.missionId);
    return res.json({ success: true, simulations });
  } catch (error) {
    return next(error);
  }
}

export async function triggerSimulationEventHandler(req, res, next) {
  try {
    const simulation = await triggerSimulationEvent(req.workspace.id, req.params.id, req.body);
    return res.json({ success: true, simulation });
  } catch (error) {
    return next(error);
  }
}

export async function submitSimulationDecisionHandler(req, res, next) {
  try {
    const simulation = await submitSimulationDecision(req.workspace.id, req.params.id, req.body);
    return res.json({ success: true, simulation });
  } catch (error) {
    return next(error);
  }
}
