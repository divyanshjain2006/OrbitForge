import test, {
  afterEach
} from "node:test";
import assert from "node:assert/strict";

import Mission from "../src/models/mission.model.js";
import Assessment from "../src/models/assessment.model.js";
import Decision from "../src/models/decision.model.js";

import {
  deleteMission
} from "../src/services/mission.service.js";

const originalFindByIdAndDelete =
  Mission.findByIdAndDelete;
const originalAssessmentDeleteMany =
  Assessment.deleteMany;
const originalDecisionDeleteMany =
  Decision.deleteMany;

afterEach(() => {
  Mission.findByIdAndDelete =
    originalFindByIdAndDelete;
  Assessment.deleteMany =
    originalAssessmentDeleteMany;
  Decision.deleteMany =
    originalDecisionDeleteMany;
});

test(
  "deleting a mission removes related assessments and decisions",
  async () => {
    const missionId =
      "6a8c548562640dbda6842b5b";
    const deletedMission = {
      _id: missionId
    };

    const assessmentFilters = [];
    const decisionFilters = [];

    Mission.findByIdAndDelete = async (id) => {
      assert.equal(id, missionId);
      return deletedMission;
    };

    Assessment.deleteMany = async (filter) => {
      assessmentFilters.push(filter);
    };

    Decision.deleteMany = async (filter) => {
      decisionFilters.push(filter);
    };

    const result = await deleteMission(missionId);

    assert.equal(result, deletedMission);
    assert.deepEqual(assessmentFilters, [
      { missionId }
    ]);
    assert.deepEqual(decisionFilters, [
      { missionId }
    ]);
  }
);
