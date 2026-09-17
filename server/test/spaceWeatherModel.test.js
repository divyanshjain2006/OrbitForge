import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateSpaceWeatherIndex } from "../src/services/spaceEnvironment/spaceWeatherModel.js";

describe("Space Weather Model 1.0.0", () => {
  it("returns a deterministic baseline LOW hazard when no events are provided", () => {
    const result = calculateSpaceWeatherIndex([]);
    assert.equal(result.spaceWeatherIndex, 0.0);
    assert.equal(result.spaceWeatherLevel, "LOW");
  });

  it("calculates index correctly for a single moderate CME", () => {
    // index = (speed/1000) * (angle/90)
    // speed 500 => 0.5
    // angle 45 => 0.5
    // index = 0.25 -> LOW
    const events = [
      { speed: 500, halfAngle: 45 }
    ];
    const result = calculateSpaceWeatherIndex(events);
    assert.equal(result.spaceWeatherIndex, 0.25);
    assert.equal(result.spaceWeatherLevel, "LOW");
  });

  it("calculates index correctly for multiple CMEs (takes maximums)", () => {
    const events = [
      { speed: 500, halfAngle: 90 }, // 0.5 * 1.0 = 0.5
      { speed: 1000, halfAngle: 45 } // 1.0 * 0.5 = 0.5
    ];
    // model takes max speed = 1000, max angle = 90
    // index = (1000/1000) * (90/90) = 1.0 -> HIGH
    const result = calculateSpaceWeatherIndex(events);
    assert.equal(result.spaceWeatherIndex, 1.0);
    assert.equal(result.spaceWeatherLevel, "HIGH");
  });

  it("clamps extremely high values to 1.0", () => {
    const events = [
      { speed: 4000, halfAngle: 200 }
    ];
    const result = calculateSpaceWeatherIndex(events);
    assert.equal(result.spaceWeatherIndex, 1.0);
    assert.equal(result.spaceWeatherLevel, "HIGH");
  });

  it("gracefully ignores events missing parameters", () => {
    const events = [
      { speed: null, halfAngle: null },
      { speed: 800, halfAngle: 45 }
    ];
    const result = calculateSpaceWeatherIndex(events);
    // speed 800 -> 0.8
    // angle 45 -> 0.5
    // index = 0.4 -> MODERATE
    assert.equal(result.spaceWeatherIndex, 0.4);
    assert.equal(result.spaceWeatherLevel, "MODERATE");
  });
});
