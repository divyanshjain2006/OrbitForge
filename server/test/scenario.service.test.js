import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeMissionScenario
} from "../src/services/scenario.service.js";

const currentMission = {
  name: "Validation baseline",
  altitude: 550,
  inclination: 51.6,
  duration: 365
};

test(
  "scenario analysis rejects configurations outside supported LEO bounds",
  () => {
    assert.throws(
      () =>
        analyzeMissionScenario({
          currentMission,
          scenario: {
            altitude: 2001,
            inclination: 51.6,
            duration: 365
          }
        }),
      /between 100 km and 2000 km/
    );

    assert.throws(
      () =>
        analyzeMissionScenario({
          currentMission,
          scenario: {
            altitude: 550,
            inclination: 51.6,
            duration: 3651
          }
        }),
      /between 1 and 3650 days/
    );
  }
);
