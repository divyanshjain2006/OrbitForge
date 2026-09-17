import Simulation from "../models/simulation.model.js";
import Mission from "../models/mission.model.js";
import { calculateMissionRisk } from "./risk.service.js";
import { assessSpaceEnvironment } from "./spaceEnvironment/spaceEnvironment.service.js";

export async function createSimulation(workspaceId, missionId) {
  const mission = await Mission.findOne({ _id: missionId, workspaceId });
  if (!mission) {
    throw new Error("Mission not found.");
  }

  const risk = calculateMissionRisk(mission);
  const environment = assessSpaceEnvironment(mission);

  const initialState = {
    configuration: {
      altitude: mission.altitude,
      inclination: mission.inclination,
      duration: mission.duration
    },
    risk: {
      score: risk.score,
      level: risk.level
    },
    environment: {
      score: environment.score,
      level: environment.level
    }
  };

  const simulation = new Simulation({
    workspaceId,
    missionId,
    status: "ACTIVE",
    performanceScore: 100,
    currentMissionDay: 0,
    initialState,
    currentState: initialState,
    timeline: [
      {
        missionDay: 0,
        type: "INITIALIZATION",
        state: initialState
      }
    ]
  });

  await simulation.save();
  return simulation;
}

export async function getSimulation(workspaceId, simulationId) {
  const simulation = await Simulation.findOne({ _id: simulationId, workspaceId }).populate("missionId");
  if (!simulation) {
    throw new Error("Simulation not found.");
  }
  return simulation;
}

export async function getMissionSimulations(workspaceId, missionId) {
  return Simulation.find({ workspaceId, missionId }).sort({ createdAt: -1 });
}

export async function triggerSimulationEvent(workspaceId, simulationId, eventData) {
  const simulation = await Simulation.findOne({ _id: simulationId, workspaceId });
  if (!simulation) {
    throw new Error("Simulation not found.");
  }
  if (simulation.status !== "ACTIVE") {
    throw new Error("Simulation is not active.");
  }

  simulation.currentMissionDay += 50; // Advance simulation time

  simulation.timeline.push({
    missionDay: simulation.currentMissionDay,
    type: "EVENT",
    event: eventData,
    state: simulation.currentState
  });

  await simulation.save();
  return simulation;
}

export async function submitSimulationDecision(workspaceId, simulationId, decisionData) {
  const simulation = await Simulation.findOne({ _id: simulationId, workspaceId }).populate("missionId");
  if (!simulation) {
    throw new Error("Simulation not found.");
  }
  if (simulation.status !== "ACTIVE") {
    throw new Error("Simulation is not active.");
  }

  const { type, description, parameters } = decisionData;
  let newConfig = { ...simulation.currentState.configuration };
  let performanceDelta = 0;

  switch (type) {
    case "MAINTAIN_ORBIT":
      performanceDelta = 5;
      break;
    case "ADJUST_ORBIT":
      if (parameters) {
        newConfig.altitude += (parameters.altitudeDeltaKm || 0);
        newConfig.inclination += (parameters.inclinationDeltaDeg || 0);
      }
      performanceDelta = -10;
      break;
    case "SAFE_MODE":
      performanceDelta = -20;
      break;
    case "GATHER_MORE_DATA":
      performanceDelta = -5;
      break;
    default:
      throw new Error("Unsupported decision type.");
  }

  newConfig.altitude = Math.max(100, Math.min(2000, newConfig.altitude));
  newConfig.inclination = Math.max(0, Math.min(180, newConfig.inclination));
  newConfig.duration = Math.max(1, Math.min(3650, newConfig.duration));

  const simulatedMission = {
    name: simulation.missionId.name,
    ...newConfig
  };

  const newRisk = calculateMissionRisk(simulatedMission);
  const newEnvironment = assessSpaceEnvironment(simulatedMission);

  const newState = {
    configuration: newConfig,
    risk: { score: newRisk.score, level: newRisk.level },
    environment: { score: newEnvironment.score, level: newEnvironment.level }
  };

  simulation.currentState = newState;
  simulation.performanceScore = Math.max(0, Math.min(100, simulation.performanceScore + performanceDelta));

  simulation.timeline.push({
    missionDay: simulation.currentMissionDay,
    type: "DECISION",
    decision: decisionData,
    state: newState
  });

  await simulation.save();
  return simulation;
}

import crypto from "node:crypto";
import mongoose from "mongoose";
import ResearchRecord from "../models/researchRecord.model.js";
import IntegrityManifest from "../models/integrityManifest.model.js";
import { CANONICALIZATION_VERSION, HASH_ALGORITHM, assertFiniteJson, sha256Digest } from "./integrity.service.js";

const SYSTEM_AGENT = "OrbitForge simulation service";
const MODEL_VERSIONS = Object.freeze({ risk: "2.0.0", environment: "1.0.0", simulation: "1.0.0" });

function buildSimulationProvenance(simulation, startedAt, completedAt) {
  return {
    entities: [{ id: "simulation-state", type: "Entity", role: "simulation-output", value: { timelineEvents: simulation.timeline.length } }],
    activity: { type: "Activity", name: "mission-simulation", startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), used: ["simulation-state"] },
    agent: { type: "Agent", id: "orbitforge-backend", name: SYSTEM_AGENT },
    relationships: { wasGeneratedBy: "mission-simulation", wasAssociatedWith: "orbitforge-backend", wasDerivedFrom: "simulation-state" }
  };
}

export async function publishSimulationToResearch(workspaceId, simulationId) {
  const simulation = await Simulation.findOne({ _id: simulationId, workspaceId }).lean();
  if (!simulation) {
    throw new Error("Simulation not found.");
  }

  // Check if it already exists
  const existingRecord = await ResearchRecord.findOne({ simulationId: simulation._id }).lean();
  if (existingRecord) return { researchRecord: existingRecord };

  const startedAt = simulation.createdAt || new Date();
  const completedAt = new Date();

  const payload = {
    recordVersion: "1.0",
    inputs: { missionId: simulation.missionId, initialState: simulation.initialState },
    outputs: { currentState: simulation.currentState, timeline: simulation.timeline, performanceScore: simulation.performanceScore, currentMissionDay: simulation.currentMissionDay },
    modelVersions: MODEL_VERSIONS,
    provenance: buildSimulationProvenance(simulation, startedAt, completedAt)
  };

  assertFiniteJson(payload);

  const recordId = new mongoose.Types.ObjectId();
  const manifestId = new mongoose.Types.ObjectId();
  const digest = sha256Digest(payload);

  try {
    await IntegrityManifest.create({ _id: manifestId, researchRecordId: recordId, algorithm: HASH_ALGORITHM, canonicalizationVersion: CANONICALIZATION_VERSION, digest, createdBy: SYSTEM_AGENT });
    const researchRecord = await ResearchRecord.create({
      _id: recordId,
      artifactType: "SIMULATION_RUN",
      missionId: simulation.missionId,
      simulationId: simulation._id,
      recordVersion: "1.0",
      semanticPayload: payload,
      canonicalizationVersion: CANONICALIZATION_VERSION,
      integrityManifestId: manifestId,
      provenance: payload.provenance
    });
    return { researchRecord, manifest: await IntegrityManifest.findById(manifestId).lean() };
  } catch (error) {
    await IntegrityManifest.deleteOne({ _id: manifestId });
    throw error;
  }
}
