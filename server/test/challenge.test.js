import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Challenge from "../src/models/challenge.model.js";
import Simulation from "../src/models/simulation.model.js";
import Mission from "../src/models/mission.model.js";
import {
  createChallenge,
  startChallenge,
  triggerNextEvent,
  submitChallengeDecision
} from "../src/services/challenge.service.js";
import { getChallengeDefinition } from "../src/services/challengeCatalog.js";

describe("Challenge Service", () => {
  let workspaceId;
  let missionId;
  let simulationId;
  let challengeId;

  const originalMissionFindOne = Mission.findOne;
  const originalSimulationFindOne = Simulation.findOne;
  const originalSimulationPrototypeSave = Simulation.prototype.save;
  const originalChallengeFindOne = Challenge.findOne;
  const originalChallengePrototypeSave = Challenge.prototype.save;

  before(() => {
    workspaceId = new mongoose.Types.ObjectId();
    missionId = new mongoose.Types.ObjectId();
    simulationId = new mongoose.Types.ObjectId();
    challengeId = new mongoose.Types.ObjectId();
  });

  afterEach(() => {
    Mission.findOne = originalMissionFindOne;
    Simulation.findOne = originalSimulationFindOne;
    Simulation.prototype.save = originalSimulationPrototypeSave;
    Challenge.findOne = originalChallengeFindOne;
    Challenge.prototype.save = originalChallengePrototypeSave;
  });

  it("should create a challenge securely scoped to a workspace", async () => {
    Mission.findOne = () => Promise.resolve({
      _id: missionId,
      workspaceId,
      name: "Test Mission",
      altitude: 500,
      inclination: 45,
      duration: 365,
      status: "ACTIVE"
    });
    
    Simulation.prototype.save = async function() { this._id = simulationId; return this; };
    Challenge.prototype.save = async function() { this._id = challengeId; return this; };

    const { challenge, simulation } = await createChallenge(workspaceId, missionId, "MISSION_CONTROL");
    
    assert.ok(challenge);
    assert.ok(simulation);
    assert.equal(challenge.status, "NOT_STARTED");
    assert.equal(challenge.challengeType, "MISSION_CONTROL");
    assert.equal(challenge.workspaceId, workspaceId);
  });

  it("should start a challenge and trigger the first event", async () => {
    const mockChallenge = new Challenge({
      _id: challengeId,
      workspaceId,
      missionId,
      simulationId,
      challengeType: "MISSION_CONTROL",
      status: "NOT_STARTED",
      currentStage: 0,
      performanceScore: 100,
      playerDecisionHistory: [],
      provenance: {}
    });

    const mockSimulation = new Simulation({
      _id: simulationId,
      workspaceId,
      missionId,
      status: "ACTIVE",
      performanceScore: 100,
      currentMissionDay: 0,
      timeline: []
    });

    Challenge.findOne = () => Promise.resolve(mockChallenge);
    Challenge.prototype.save = async function() { return this; };
    Simulation.findOne = () => Promise.resolve(mockSimulation);
    Simulation.prototype.save = async function() { return this; };
    
    const { challenge, simulation } = await startChallenge(workspaceId, challengeId);
    
    assert.equal(challenge.status, "DECISION_REQUIRED");
    assert.ok(challenge.provenance.startedAt);
    assert.equal(simulation.timeline.length, 1);
    assert.equal(simulation.timeline[0].type, "EVENT");
    assert.equal(simulation.timeline[0].event.type, "ENVIRONMENTAL_CHANGE");
  });

  it("should accept a valid decision, affect score, and advance stage", async () => {
    const mockChallenge = {
      _id: challengeId,
      workspaceId,
      missionId,
      simulationId,
      challengeType: "MISSION_CONTROL",
      status: "DECISION_REQUIRED",
      currentStage: 0,
      performanceScore: 100,
      playerDecisionHistory: [],
      provenance: {},
      save: async function() { return this; }
    };

    const mockSimulation = {
      _id: simulationId,
      workspaceId,
      missionId,
      status: "ACTIVE",
      performanceScore: 100,
      currentMissionDay: 0,
      timeline: [],
      currentState: { configuration: { altitude: 500, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      save: async function() { return this; }
    };

    const mockQuery = Promise.resolve(mockChallenge);
    mockQuery.populate = () => mockQuery;
    Challenge.findOne = () => mockQuery;

    const mockSimQuery = Promise.resolve(mockSimulation);
    mockSimQuery.populate = () => mockSimQuery;
    Simulation.findOne = () => mockSimQuery;
    
    const decisionData = {
      type: "ADJUST_ORBIT",
      description: "Dodging debris",
      parameters: { altitudeDeltaKm: 10 }
    };

    const { challenge, simulation } = await submitChallengeDecision(workspaceId, challengeId, decisionData);
    
    assert.equal(challenge.status, "DECISION_REQUIRED"); // Because the NEXT event triggers
    assert.equal(challenge.currentStage, 1); // Advanced to next stage
    assert.equal(challenge.performanceScore, 90); // ADJUST_ORBIT penalty is -10
    assert.equal(challenge.playerDecisionHistory.length, 1);
    
    assert.equal(simulation.timeline.length, 2); // 1 Decision + 1 New Event
    assert.equal(simulation.timeline[0].type, "DECISION");
    assert.equal(simulation.timeline[1].type, "EVENT");
  });
  
  it("should complete the challenge when no more stages exist", async () => {
    const mockChallenge = {
      _id: challengeId,
      workspaceId,
      missionId,
      simulationId,
      challengeType: "MISSION_CONTROL",
      status: "DECISION_REQUIRED",
      currentStage: 1,
      performanceScore: 90,
      playerDecisionHistory: [],
      provenance: {},
      save: async function() { return this; }
    };

    const mockSimulation = {
      _id: simulationId,
      workspaceId,
      missionId,
      status: "ACTIVE",
      performanceScore: 100,
      currentMissionDay: 50,
      timeline: [],
      currentState: { configuration: { altitude: 510, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      save: async function() { return this; }
    };

    const mockQuery = Promise.resolve(mockChallenge);
    mockQuery.populate = () => mockQuery;
    Challenge.findOne = () => mockQuery;

    const mockSimQuery = Promise.resolve(mockSimulation);
    mockSimQuery.populate = () => mockSimQuery;
    Simulation.findOne = () => mockSimQuery;
    
    const decisionData = {
      type: "SAFE_MODE",
      description: "Hunkering down"
    };

    const { challenge } = await submitChallengeDecision(workspaceId, challengeId, decisionData);
    
    assert.equal(challenge.status, "COMPLETED");
    assert.equal(challenge.currentStage, 2);
    assert.equal(challenge.performanceScore, 70); // SAFE_MODE penalty is -20
    assert.ok(challenge.provenance.completedAt);
  });
});
