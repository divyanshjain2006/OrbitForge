import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Mission from "../src/models/mission.model.js";
import Simulation from "../src/models/simulation.model.js";
import {
  createSimulation,
  triggerSimulationEvent,
  submitSimulationDecision
} from "../src/services/simulation.service.js";

describe("Simulation Service", () => {
  let workspaceId;
  let missionId;
  let simulationId;

  const originalMissionFindOne = Mission.findOne;
  const originalSimulationFindOne = Simulation.findOne;
  const originalSimulationPrototypeSave = Simulation.prototype.save;

  before(() => {
    workspaceId = new mongoose.Types.ObjectId();
    missionId = new mongoose.Types.ObjectId();
    simulationId = new mongoose.Types.ObjectId();
  });

  afterEach(() => {
    Mission.findOne = originalMissionFindOne;
    Simulation.findOne = originalSimulationFindOne;
    Simulation.prototype.save = originalSimulationPrototypeSave;
  });

  it("should create a simulation with deterministic initial state", async () => {
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

    const simulation = await createSimulation(workspaceId, missionId);
    
    assert.ok(simulation);
    assert.equal(simulation.status, "ACTIVE");
    assert.equal(simulation.initialState.configuration.altitude, 500);
    assert.equal(simulation.currentState.configuration.altitude, 500);
    assert.equal(simulation.timeline.length, 1);
    assert.equal(simulation.timeline[0].type, "INITIALIZATION");
  });

  it("should trigger an event and advance the timeline", async () => {
    const mockSimulation = new Simulation({
      _id: simulationId,
      workspaceId,
      missionId,
      status: "ACTIVE",
      performanceScore: 100,
      currentMissionDay: 0,
      initialState: { configuration: { altitude: 500, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      currentState: { configuration: { altitude: 500, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      timeline: []
    });

    Simulation.findOne = () => Promise.resolve(mockSimulation);
    Simulation.prototype.save = async function() { return this; };
    
    const eventData = {
      type: "ENVIRONMENTAL_CHANGE",
      description: "Solar flare detected"
    };
    
    const updated = await triggerSimulationEvent(workspaceId, simulationId, eventData);
    
    assert.equal(updated.currentMissionDay, 50);
    assert.equal(updated.timeline.length, 1);
    assert.equal(updated.timeline[0].type, "EVENT");
    assert.equal(updated.timeline[0].event.type, "ENVIRONMENTAL_CHANGE");
  });

  it("should accept a decision and update scientific state deterministically", async () => {
    const mockSimulation = {
      _id: simulationId,
      workspaceId,
      missionId: { _id: missionId, name: "Test Mission" },
      status: "ACTIVE",
      performanceScore: 100,
      currentMissionDay: 50,
      initialState: { configuration: { altitude: 500, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      currentState: { configuration: { altitude: 500, inclination: 45, duration: 365 }, risk: { score: 10, level: 'LOW' }, environment: { score: 10, level: 'LOW' } },
      timeline: [],
      save: async function() { return this; }
    };
    
    Simulation.findOne = () => ({
      populate: () => Promise.resolve(mockSimulation)
    });
    
    const decisionData = {
      type: "ADJUST_ORBIT",
      description: "Raising altitude to avoid drag",
      parameters: { altitudeDeltaKm: 50 }
    };
    
    const updated = await submitSimulationDecision(workspaceId, simulationId, decisionData);
    
    assert.equal(updated.currentState.configuration.altitude, 550);
    assert.equal(updated.performanceScore, 90);
    assert.equal(updated.timeline.length, 1);
    assert.equal(updated.timeline[0].type, "DECISION");
    assert.equal(updated.timeline[0].state.configuration.altitude, 550);
  });
});
