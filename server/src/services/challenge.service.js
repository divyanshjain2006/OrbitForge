import Challenge from "../models/challenge.model.js";
import { getChallengeDefinition } from "./challengeCatalog.js";
import { createSimulation, triggerSimulationEvent, submitSimulationDecision, getSimulation } from "./simulation.service.js";

export async function createChallenge(workspaceId, missionId, challengeType) {
  const definition = getChallengeDefinition(challengeType);
  if (!definition) {
    throw new Error(`Invalid challenge type: ${challengeType}`);
  }

  // Create the underlying simulation
  const simulation = await createSimulation(workspaceId, missionId);

  const challenge = new Challenge({
    workspaceId,
    missionId,
    simulationId: simulation._id,
    challengeType,
    status: "NOT_STARTED",
    currentStage: 0,
    performanceScore: 100,
    playerDecisionHistory: []
  });

  await challenge.save();
  return { challenge, simulation };
}

export async function getMissionChallenges(workspaceId, missionId) {
  const challenges = await Challenge.find({ workspaceId, missionId }).sort({ createdAt: -1 });
  return challenges;
}

export async function getChallenge(workspaceId, challengeId) {
  const challenge = await Challenge.findOne({ _id: challengeId, workspaceId }).populate("simulationId");
  if (!challenge) throw new Error("Challenge not found");
  return challenge;
}

export async function startChallenge(workspaceId, challengeId) {
  const challenge = await Challenge.findOne({ _id: challengeId, workspaceId });
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "NOT_STARTED") throw new Error("Challenge already started");

  challenge.status = "ACTIVE";
  challenge.provenance.startedAt = new Date();
  await challenge.save();

  return triggerNextEvent(workspaceId, challengeId);
}

export async function triggerNextEvent(workspaceId, challengeId) {
  const challenge = await Challenge.findOne({ _id: challengeId, workspaceId });
  if (!challenge) throw new Error("Challenge not found");

  const definition = getChallengeDefinition(challenge.challengeType);
  const stageDef = definition.stages[challenge.currentStage];

  if (!stageDef) {
    challenge.status = "COMPLETED";
    challenge.provenance.completedAt = new Date();
    await challenge.save();
    return { challenge, simulation: await getSimulation(workspaceId, challenge.simulationId) };
  }

  // Pipe the event to the simulation
  const simulation = await triggerSimulationEvent(workspaceId, challenge.simulationId, stageDef.event);

  challenge.status = "DECISION_REQUIRED";
  await challenge.save();

  return { challenge, simulation };
}

export async function submitChallengeDecision(workspaceId, challengeId, decisionData) {
  const challenge = await Challenge.findOne({ _id: challengeId, workspaceId });
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "DECISION_REQUIRED") throw new Error("Decision not required at this stage");

  const definition = getChallengeDefinition(challenge.challengeType);
  const stageDef = definition.stages[challenge.currentStage];

  if (!stageDef.availableDecisions.includes(decisionData.type)) {
    throw new Error(`Decision type ${decisionData.type} not allowed for this stage`);
  }

  // Adjust score based on catalog rules
  const scoreDelta = definition.scoringRules[decisionData.type] || 0;
  challenge.performanceScore = Math.max(0, challenge.performanceScore + scoreDelta);

  // Record decision history
  challenge.playerDecisionHistory.push({
    stage: challenge.currentStage,
    decision: decisionData
  });

  // Pipe decision to simulation
  let simulation = await submitSimulationDecision(workspaceId, challenge.simulationId, decisionData);

  challenge.currentStage += 1;
  challenge.status = "ACTIVE";
  await challenge.save();

  // Try to trigger the next event automatically, or complete if no more stages
  return triggerNextEvent(workspaceId, challengeId);
}

import crypto from "node:crypto";
import mongoose from "mongoose";
import ResearchRecord from "../models/researchRecord.model.js";
import IntegrityManifest from "../models/integrityManifest.model.js";
import { CANONICALIZATION_VERSION, HASH_ALGORITHM, assertFiniteJson, sha256Digest } from "./integrity.service.js";

const SYSTEM_AGENT = "OrbitForge challenge service";
const MODEL_VERSIONS = Object.freeze({ challenge: "1.0.0" });

function buildChallengeProvenance(challenge, startedAt, completedAt) {
  return {
    entities: [{ id: "challenge-state", type: "Entity", role: "challenge-output", value: { stages: challenge.currentStage, score: challenge.performanceScore } }],
    activity: { type: "Activity", name: "mission-challenge", startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), used: ["challenge-state"] },
    agent: { type: "Agent", id: "orbitforge-backend", name: SYSTEM_AGENT },
    relationships: { wasGeneratedBy: "mission-challenge", wasAssociatedWith: "orbitforge-backend", wasDerivedFrom: "challenge-state" }
  };
}

export async function publishChallengeToResearch(workspaceId, challengeId) {
  const challenge = await Challenge.findOne({ _id: challengeId, workspaceId }).lean();
  if (!challenge) {
    throw new Error("Challenge not found.");
  }

  const existingRecord = await ResearchRecord.findOne({ challengeId: challenge._id }).lean();
  if (existingRecord) return { researchRecord: existingRecord };

  const startedAt = challenge.createdAt || new Date();
  const completedAt = new Date();

  const payload = {
    recordVersion: "1.0",
    inputs: { missionId: challenge.missionId, challengeType: challenge.challengeType },
    outputs: { status: challenge.status, performanceScore: challenge.performanceScore, currentStage: challenge.currentStage, playerDecisionHistory: challenge.playerDecisionHistory },
    modelVersions: MODEL_VERSIONS,
    provenance: buildChallengeProvenance(challenge, startedAt, completedAt)
  };

  assertFiniteJson(payload);

  const recordId = new mongoose.Types.ObjectId();
  const manifestId = new mongoose.Types.ObjectId();
  const digest = sha256Digest(payload);

  try {
    await IntegrityManifest.create({ _id: manifestId, researchRecordId: recordId, algorithm: HASH_ALGORITHM, canonicalizationVersion: CANONICALIZATION_VERSION, digest, createdBy: SYSTEM_AGENT });
    const researchRecord = await ResearchRecord.create({
      _id: recordId,
      artifactType: "CHALLENGE_RUN",
      missionId: challenge.missionId,
      challengeId: challenge._id,
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
