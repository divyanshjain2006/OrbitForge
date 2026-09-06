import test, {
  afterEach
} from "node:test";
import assert from "node:assert/strict";

import Mission from "../src/models/mission.model.js";
import Decision from "../src/models/decision.model.js";
import Assessment from "../src/models/assessment.model.js";

import {
  createDecision
} from "../src/controllers/decision.controller.js";

const TEST_MISSION_ID =
  "6a8c548562640dbda6842b5b";

const originalMissionFindById =
  Mission.findById;
const originalDecisionCreate =
  Decision.create;
const originalAssessmentFindOne =
  Assessment.findOne;

afterEach(() => {
  Mission.findById = originalMissionFindById;
  Decision.create = originalDecisionCreate;
  Assessment.findOne =
    originalAssessmentFindOne;
});

function createResponse() {
  const response = {
    statusCode: 200,
    body: null,

    status(code) {
      response.statusCode = code;
      return response;
    },

    json(data) {
      response.body = data;
      return response;
    }
  };

  return response;
}

test(
  "approving a scenario keeps the mission pending until it is applied",
  async () => {
    const scenarioId =
      "6a8c548562640dbda6842b6c";

    const mission = {
      _id: TEST_MISSION_ID,
      name: "Baseline mission",
      altitude: 550,
      inclination: 51.6,
      duration: 365,

      decision: {
        status: "PENDING_REVIEW",
        label: "Pending review"
      },

      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;

    Assessment.findOne = () => ({
      lean: async () => ({
        _id: scenarioId,
        missionId: TEST_MISSION_ID,
        type: "SCENARIO_SIMULATION",

        configuration: {
          altitude: 700,
          inclination: 97.4,
          duration: 180
        },

        risk: {
          score: 10,
          level: "LOW"
        },

        environment: {
          score: 6,
          level: "LOW"
        }
      })
    });

    Decision.create = async (data) => ({
      _id: "decision-scenario-approval",
      ...data
    });

    const response = createResponse();

    await createDecision(
      {
        params: {
          missionId: TEST_MISSION_ID
        },

        body: {
          decision: "APPROVE",
          reason:
            "The proposed configuration improves the modeled risk profile.",
          source: "SCENARIO_SIMULATION",
          scenarioId
        }
      },
      response
    );

    assert.equal(response.statusCode, 201);
    assert.equal(
      mission.decision.status,
      "SCENARIO_APPROVED"
    );
    assert.equal(
      mission.decision.label,
      "Scenario approved — apply configuration"
    );
    assert.equal(
      String(mission.decision.scenarioId),
      scenarioId
    );
    assert.equal(
      response.body.decision.configuration.altitude,
      700
    );
  }
);
