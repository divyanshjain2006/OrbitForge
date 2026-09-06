import test from "node:test";
import assert from "node:assert/strict";

import { calculateOrbitalAnalysis } from "../src/services/analysis/orbitalAnalysis.service.js";
import { calculateMissionRisk } from "../src/services/risk.service.js";
import { assessSpaceEnvironment } from "../src/services/spaceEnvironment/spaceEnvironment.service.js";

test("circular two-body calculation gives the documented 400 km reference estimate", () => {
  const result = calculateOrbitalAnalysis({
    name: "Reference circular orbit",
    altitude: 400,
    inclination: 51.6,
    duration: 1
  });

  // Derived directly from r = 6378.137 + 400 km, v = sqrt(mu/r),
  // and T = 2*pi*sqrt(r^3/mu), using the constants declared by the service.
  assert.equal(result.orbitalRadiusKm, 6778.137);
  assert.equal(result.orbitalVelocityKmPerSecond, 7.6686);
  assert.equal(result.orbitalPeriodMinutes, 92.56);
  assert.equal(result.revolutionsPerDay, 15.557);
  assert.equal(result.methodology.type, "deterministic-circular-two-body-estimate");
  assert.equal(result.methodology.provenance, "MODELED");
});

test("model services reject invalid and out-of-domain configurations", () => {
  const invalid = { altitude: Infinity, inclination: 20, duration: 10 };
  assert.throws(() => calculateMissionRisk(invalid), /Invalid mission parameters/);
  assert.throws(() => calculateOrbitalAnalysis({ altitude: 2001, inclination: 20, duration: 10 }), /between 100 km and 2000 km/);
  assert.throws(() => assessSpaceEnvironment({ altitude: 99, inclination: 20 }), /outside OrbitGuard/);
});

test("risk rule coverage is explicitly not statistical confidence", () => {
  const risk = calculateMissionRisk({ altitude: 250, inclination: 130, duration: 300 });
  assert.equal(risk.score, 50);
  assert.equal(risk.ruleCoverage, "MODERATE");
  assert.equal("confidence" in risk, false);
});
