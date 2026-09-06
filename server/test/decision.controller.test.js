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

/*
 * =========================================================
 * TEST HELPERS
 * =========================================================
 */

const TEST_MISSION_ID =
  "6a8c548562640dbda6842d5b";

const BASELINE_MISSION = {
  _id: TEST_MISSION_ID,
  name: "Test Mission",
  altitude: 250,
  inclination: 130,
  duration: 300,

  decision: {
    status: "PENDING_REVIEW",
    label: "Pending review"
  },

  async save() {
    return this;
  }
};

const originalMissionFindById =
  Mission.findById;

const originalDecisionCreate =
  Decision.create;

const originalDecisionDelete =
  Decision.findByIdAndDelete;

const originalAssessmentFindOne =
  Assessment.findOne;

afterEach(() => {
  Mission.findById =
    originalMissionFindById;

  Decision.create =
    originalDecisionCreate;

  Decision.findByIdAndDelete =
    originalDecisionDelete;

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

/*
 * =========================================================
 * CURRENT-CONFIGURATION DECISION
 * =========================================================
 */

test(
  "APPROVE creates an authoritative decision and updates mission state",
  async () => {
    const mission = {
      ...BASELINE_MISSION,
      decision: {
        status: "PENDING_REVIEW",
        label: "Pending review"
      },

      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;

    let storedDecision = null;

    Decision.create = async (data) => {
      storedDecision = {
        _id: "decision-test-1",
        ...data
      };

      return storedDecision;
    };

    const req = {
      params: {
        missionId: TEST_MISSION_ID
      },

      body: {
        decision: "APPROVE",

        /*
         * Deliberately fake browser values.
         * They must NOT become the audit snapshot.
         */
        configuration: {
          altitude: 9999,
          inclination: 1,
          duration: 1
        },

        risk: {
          score: 1,
          level: "LOW"
        },

        environment: {
          score: 1,
          level: "LOW"
        },

        reason:
          "Baseline configuration is acceptable.",

        source:
          "CURRENT_CONFIGURATION"
      }
    };

    const res =
      createResponse();

    await createDecision(req, res);

    assert.equal(
      res.statusCode,
      201
    );

    assert.equal(
      res.body.success,
      true
    );

    /*
     * Mission state must be updated.
     */
    assert.equal(
      mission.decision.status,
      "APPROVED"
    );

    assert.equal(
      mission.decision.label,
      "Mission approved"
    );

    assert.equal(
      mission.decision.reason,
      "Baseline configuration is acceptable."
    );

    /*
     * Server-authoritative configuration.
     */
    assert.deepEqual(
      storedDecision.configuration,
      {
        altitude: 250,
        inclination: 130,
        duration: 300
      }
    );

    /*
     * Server-authoritative risk/environment.
     */
    assert.equal(
      storedDecision.risk.level,
      "HIGH"
    );

    assert.equal(
      storedDecision.risk.score,
      50
    );

    assert.equal(
      storedDecision.environment.level,
      "ELEVATED"
    );

    assert.equal(
      storedDecision.environment.score,
      29
    );
  }
);

/*
 * =========================================================
 * REVIEW MAPPING
 * =========================================================
 */

test(
  "REVIEW maps to HOLD on the mission",
  async () => {
    const mission = {
      ...BASELINE_MISSION,

      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;

    Decision.create = async (data) => ({
      _id: "decision-test-2",
      ...data
    });

    const req = {
      params: {
        missionId: TEST_MISSION_ID
      },

      body: {
        decision: "REVIEW",
        reason:
          "Additional review is required.",
        source:
          "CURRENT_CONFIGURATION"
      }
    };

    const res =
      createResponse();

    await createDecision(req, res);

    assert.equal(
      res.statusCode,
      201
    );

    assert.equal(
      mission.decision.status,
      "HOLD"
    );

    assert.equal(
      mission.decision.label,
      "Hold for review"
    );
  }
);

/*
 * =========================================================
 * REJECT MAPPING
 * =========================================================
 */

test(
  "REJECT maps to REJECTED on the mission",
  async () => {
    const mission = {
      ...BASELINE_MISSION,

      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;

    Decision.create = async (data) => ({
      _id: "decision-test-3",
      ...data
    });

    const req = {
      params: {
        missionId: TEST_MISSION_ID
      },

      body: {
        decision: "REJECT",
        reason:
          "Current configuration should not proceed.",
        source:
          "CURRENT_CONFIGURATION"
      }
    };

    const res =
      createResponse();

    await createDecision(req, res);

    assert.equal(
      res.statusCode,
      201
    );

    assert.equal(
      mission.decision.status,
      "REJECTED"
    );

    assert.equal(
      mission.decision.label,
      "Mission rejected"
    );
  }
);

/*
 * =========================================================
 * INVALID SCENARIO
 * =========================================================
 */

test(
  "scenario decision requires a valid stored scenario assessment",
  async () => {
    const mission = {
      ...BASELINE_MISSION,

      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;

    Assessment.findOne = () => ({
      lean: async () => null
    });

    let decisionCreated = false;

    Decision.create = async () => {
      decisionCreated = true;
      return {};
    };

    const req = {
      params: {
        missionId: TEST_MISSION_ID
      },

      body: {
        decision: "APPROVE",

        reason:
          "Approve the proposed scenario.",

        source:
          "SCENARIO_SIMULATION",

        scenarioId:
          "missing-scenario-id"
      }
    };

    const res =
      createResponse();

    await createDecision(req, res);

    assert.equal(
      res.statusCode,
      404
    );

    assert.equal(
      res.body.success,
      false
    );

    assert.equal(
      decisionCreated,
      false
    );
  }
);

test(
  "scenario decision rejects an out-of-domain persisted configuration",
  async () => {
    const mission = {
      ...BASELINE_MISSION,
      async save() {
        return this;
      }
    };

    Mission.findById = async () => mission;
    Assessment.findOne = () => ({
      lean: async () => ({
        _id: "6a8c548562640dbda6842b6c",
        missionId: TEST_MISSION_ID,
        type: "SCENARIO_SIMULATION",
        configuration: {
          altitude: 2001,
          inclination: 51.6,
          duration: 30
        },
        risk: { score: 10, level: "LOW" },
        environment: { score: 0, level: "LOW" }
      })
    });

    let decisionCreated = false;
    Decision.create = async () => {
      decisionCreated = true;
    };

    const res = createResponse();
    await createDecision({
      params: { missionId: TEST_MISSION_ID },
      body: {
        decision: "APPROVE",
        reason: "The stored scenario requires a boundary check.",
        source: "SCENARIO_SIMULATION",
        scenarioId: "6a8c548562640dbda6842b6c"
      }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(decisionCreated, false);
  }
);

test(
  "scenario decision rejects invalid persisted risk or environment snapshots",
  async () => {
    const mission = {
      ...BASELINE_MISSION,
      async save() {
        return this;
      }
    };
    Mission.findById = async () => mission;

    const invalidSnapshots = [
      { risk: { score: null, level: "LOW" }, environment: { score: 0, level: "LOW" } },
      { risk: { score: 10, level: "NOT_A_LEVEL" }, environment: { score: 0, level: "LOW" } },
      { risk: { score: 10, level: "LOW" }, environment: { score: Infinity, level: "LOW" } },
      { risk: { score: 10, level: "LOW" }, environment: { score: 0, level: "NOT_A_LEVEL" } }
    ];

    for (const snapshots of invalidSnapshots) {
      Assessment.findOne = () => ({
        lean: async () => ({
          _id: "6a8c548562640dbda6842b6c",
          missionId: TEST_MISSION_ID,
          type: "SCENARIO_SIMULATION",
          configuration: { altitude: 700, inclination: 97.4, duration: 180 },
          ...snapshots
        })
      });

      let decisionCreated = false;
      Decision.create = async () => {
        decisionCreated = true;
      };

      const res = createResponse();
      await createDecision({
        params: { missionId: TEST_MISSION_ID },
        body: {
          decision: "APPROVE",
          reason: "The stored scenario requires a snapshot check.",
          source: "SCENARIO_SIMULATION",
          scenarioId: "6a8c548562640dbda6842b6c"
        }
      }, res);

      assert.equal(res.statusCode, 400);
      assert.equal(decisionCreated, false);
    }
  }
);

/*
 * =========================================================
 * ROLLBACK
 * =========================================================
 */

test(
  "failed mission update rolls back the decision record",
  async () => {
    const mission = {
      ...BASELINE_MISSION,

      async save() {
        throw new Error(
          "Simulated mission save failure"
        );
      }
    };

    Mission.findById = async () => mission;

    let deletedDecisionId = null;

    Decision.create = async (data) => ({
      _id: "decision-rollback-test",
      ...data
    });

    Decision.findByIdAndDelete =
      async (id) => {
        deletedDecisionId = id;
      };

    const req = {
      params: {
        missionId: TEST_MISSION_ID
      },

      body: {
        decision: "APPROVE",

        reason:
          "Testing transactional rollback.",

        source:
          "CURRENT_CONFIGURATION"
      }
    };

    const res =
      createResponse();

    await createDecision(req, res);

    assert.equal(
      res.statusCode,
      500
    );

    assert.equal(
      res.body.success,
      false
    );

    assert.equal(
      deletedDecisionId,
      "decision-rollback-test"
    );
  }
);
