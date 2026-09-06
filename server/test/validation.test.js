import test from "node:test";
import assert from "node:assert/strict";

import {
  validateMissionConfiguration,
  validateScenarioAssessmentSnapshot
} from "../src/middleware/validation.js";

test("mission configuration validation allowlists fields and rejects unsafe numerics", () => {
  assert.deepEqual(
    validateMissionConfiguration({
      name: "  Test mission  ",
      altitude: 550,
      inclination: 51.6,
      duration: 365
    }, { requireName: true }),
    { name: "Test mission", altitude: 550, inclination: 51.6, duration: 365 }
  );

  assert.throws(
    () => validateMissionConfiguration({ altitude: 550, inclination: 30, duration: Infinity }),
    /finite number/
  );
  assert.throws(
    () => validateMissionConfiguration({ altitude: 550, inclination: 30, duration: 10, injected: true }),
    /Unsupported field/
  );
});

test("scenario assessment snapshots require canonical configuration and model output domains", () => {
  const validSnapshot = {
    configuration: { altitude: 700, inclination: 97.4, duration: 180 },
    risk: { score: 10, level: "LOW" },
    environment: { score: 6, level: "LOW" }
  };

  assert.deepEqual(
    validateScenarioAssessmentSnapshot(validSnapshot),
    validSnapshot
  );

  assert.throws(
    () => validateScenarioAssessmentSnapshot({
      ...validSnapshot,
      configuration: { ...validSnapshot.configuration, altitude: 2001 }
    }),
    /altitude must be between/
  );
  assert.throws(
    () => validateScenarioAssessmentSnapshot({
      ...validSnapshot,
      risk: { score: NaN, level: "LOW" }
    }),
    /risk snapshot is invalid/
  );
  assert.throws(
    () => validateScenarioAssessmentSnapshot({
      ...validSnapshot,
      environment: { score: 0, level: "UNKNOWN" }
    }),
    /environment snapshot is invalid/
  );
});
