import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeDonkiPayload } from "../src/services/nasa/donki.adapter.js";

describe("NASA DONKI Adapter", () => {
  it("normalizes a valid CME payload containing an array of events", () => {
    const rawPayload = [
      {
        activityID: "2026-09-17T12:00:00-CME-001",
        startTime: "2026-09-17T12:00Z",
        catalog: "ALL",
        note: "Test CME",
        cmeAnalyses: [
          {
            isMostAccurate: true,
            speed: 1200.5,
            halfAngle: 45,
            latitude: 10,
            longitude: -20,
            type: "C",
            time21_5: "2026-09-17T13:00Z",
            associatedCMEID: "2026-09-17T12:00:00-CME-001"
          },
          {
            isMostAccurate: false,
            speed: 1000,
            type: "S"
          }
        ]
      }
    ];

    const result = normalizeDonkiPayload(rawPayload);
    
    assert.equal(result.schema, "orbitforge.nasa-donki/1.0");
    assert.equal(result.objects.length, 1);
    
    const obj = result.objects[0];
    assert.equal(obj.activityID, "2026-09-17T12:00:00-CME-001");
    assert.equal(obj.speed, 1200.5);
    assert.equal(obj.halfAngle, 45);
    assert.equal(obj.latitude, 10);
    assert.equal(obj.longitude, -20);
    assert.equal(obj.type, "C");
    assert.equal(obj.isMostAccurate, true);
  });

  it("selects the last analysis if isMostAccurate is not present", () => {
    const rawPayload = [
      {
        activityID: "CME-002",
        cmeAnalyses: [
          { speed: 500, type: "S" },
          { speed: 800, type: "C" }
        ]
      }
    ];

    const result = normalizeDonkiPayload(rawPayload);
    assert.equal(result.objects[0].speed, 800);
    assert.equal(result.objects[0].type, "C");
  });

  it("handles events with no analyses gracefully", () => {
    const rawPayload = [
      {
        activityID: "CME-003",
        cmeAnalyses: []
      }
    ];

    const result = normalizeDonkiPayload(rawPayload);
    assert.equal(result.objects[0].speed, null);
    assert.equal(result.objects[0].type, null);
  });

  it("throws if payload is not an array", () => {
    assert.throws(() => {
      normalizeDonkiPayload({ error: "not an array" });
    }, /DONKI response does not contain an object collection/);
  });

  it("throws if activityID is missing", () => {
    assert.throws(() => {
      normalizeDonkiPayload([{ catalog: "ALL" }]);
    }, /DONKI event is missing activityID/);
  });
});
