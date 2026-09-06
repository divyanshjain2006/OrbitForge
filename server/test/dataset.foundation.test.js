import test from "node:test";
import assert from "node:assert/strict";
import { normalizeScoutPayload } from "../src/services/nasa/scout.adapter.js";
import { retrieveScoutPayload } from "../src/services/nasa/scout.service.js";
import { evaluateDatasetVersion } from "../src/services/datasetValidation.service.js";
import { sha256Digest } from "../src/services/integrity.service.js";

const scoutFixture = [{ objectName: "P10abc", nObs: "5", arc: "1.5", rating: "1", neoScore: "90", phaScore: "3", lastRun: "2026-09-05T00:00:00Z", tEphem: "2026-09-05T00:15:00Z" }];

test("Scout adapter normalizes a source-specific payload without retaining its envelope", () => {
  const normalized = normalizeScoutPayload(scoutFixture);
  assert.equal(normalized.schema, "orbitforge.cneos-scout/1.0");
  assert.deepEqual(normalized.objects[0], { designation: "P10abc", observationCount: 5, arcHours: 1.5, impactRating: 1, neoScore: 90, phaScore: 3, lastRun: "2026-09-05T00:00:00Z", ephemerisTime: "2026-09-05T00:15:00Z" });
});

test("Scout adapter rejects malformed source responses", () => {
  assert.throws(() => normalizeScoutPayload({ unexpected: "shape" }), /does not contain/);
  assert.throws(() => normalizeScoutPayload([{ nObs: "not-a-number" }]), /Malformed Scout response/);
});

test("Scout retrieval uses a mocked response and surfaces network failures", async () => {
  const result = await retrieveScoutPayload({ fetcher: async () => ({ ok: true, json: async () => scoutFixture }) });
  assert.equal(result.normalizedPayload.objects.length, 1);
  await assert.rejects(() => retrieveScoutPayload({ fetcher: async () => { throw new Error("offline"); } }), /offline/);
});

test("dataset validation distinguishes valid, warning, and invalid normalized data", () => {
  assert.equal(evaluateDatasetVersion(normalizeScoutPayload(scoutFixture)).status, "VALID");
  assert.equal(evaluateDatasetVersion({ objects: [] }).status, "VALID_WITH_WARNINGS");
  assert.equal(evaluateDatasetVersion({ objects: [{ designation: "A" }, { designation: "A" }] }).status, "INVALID");
});

test("raw and normalized payload hashes are deterministic JCS SHA-256 identities", () => {
  assert.equal(sha256Digest({ b: 2, a: 1 }), sha256Digest({ a: 1, b: 2 }));
  assert.match(sha256Digest(normalizeScoutPayload(scoutFixture)), /^sha256:[a-f0-9]{64}$/);
});
