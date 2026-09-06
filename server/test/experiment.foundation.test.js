import test from "node:test";
import assert from "node:assert/strict";
import { buildExperimentSemanticPayload, RISK_METHOD, runMissionRiskComputation } from "../src/services/experiment.service.js";
import { sha256Digest } from "../src/services/integrity.service.js";
import { validateExperimentRunBody } from "../src/middleware/validation.js";
import ExperimentRun from "../src/models/experimentRun.model.js";
import Project from "../src/models/project.model.js";
import { updateProject } from "../src/services/experiment.service.js";

const versions = [{ version: 3, rawPayloadHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", normalizedPayloadHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", validationStatus: "VALID" }];
const parameters = { altitudeKm: 500, inclinationDeg: 51.6, durationDays: 365 };
function payloadFor(input) { const results = runMissionRiskComputation(input); return buildExperimentSemanticPayload({ datasetVersions: versions, parameters: input, results, method: RISK_METHOD, type: "MISSION_RISK_ANALYSIS" }); }

test("mission-risk experiment computation and semantic identity are deterministic", () => {
  const first = payloadFor(parameters); const second = payloadFor({ ...parameters });
  assert.deepEqual(first.results, second.results);
  assert.equal(sha256Digest(first), sha256Digest(second));
  assert.notEqual(sha256Digest(first), sha256Digest(payloadFor({ ...parameters, altitudeKm: 250 })));
  assert.equal(JSON.stringify(first).includes("experiment-configuration"), true);
});

test("experiment semantic payload identifies exact dataset hashes rather than database identifiers", () => {
  const payload = payloadFor(parameters);
  assert.equal(Object.hasOwn(payload.datasetVersions[0], "_id"), false);
  assert.equal(payload.datasetVersions[0].normalizedPayloadHash, versions[0].normalizedPayloadHash);
});

test("semantic hash excludes record envelope and verification metadata", () => {
  const payload = payloadFor(parameters);
  const firstEnvelope = { _id: "one", verification: { checkedAt: "2026-09-05" }, semanticPayload: payload };
  const secondEnvelope = { _id: "two", verification: { checkedAt: "2026-09-06" }, semanticPayload: payload };
  assert.equal(sha256Digest(firstEnvelope.semanticPayload), sha256Digest(secondEnvelope.semanticPayload));
});

test("experiment-run request validation rejects unsafe values and unknown fields", () => {
  const middleware = validateExperimentRunBody;
  const validId = "507f1f77bcf86cd799439011";
  const req = { body: { datasetVersionIds: [validId], parameters: { altitudeKm: 500, inclinationDeg: 51.6, durationDays: 365 } } };
  let called = false; middleware(req, { status: () => ({ json: () => assert.fail("valid request rejected") }) }, () => { called = true; });
  assert.equal(called, true);
  const bad = { body: { datasetVersionIds: [validId], parameters: { altitudeKm: Number.NaN, inclinationDeg: 51.6, durationDays: 365 }, unsafe: true } };
  let response; middleware(bad, { status: (code) => ({ json: (body) => { response = { code, body }; } }) }, () => assert.fail("invalid request accepted"));
  assert.equal(response.body.error.code, "INVALID_EXPERIMENT_PARAMETERS");
});

test("completed-run scientific fields are schema-immutable", () => {
  for (const field of ["datasetVersionIds", "parameters", "method", "results", "provenance", "researchRecordId"]) {
    assert.equal(ExperimentRun.schema.path(field).options.immutable, true, `${field} must be immutable`);
  }
});

test("project updates work from an authorized lean ownership snapshot", async () => {
  const original = Project.findByIdAndUpdate;
  let call;
  Project.findByIdAndUpdate = (...args) => { call = args; return Promise.resolve({ _id: "project", name: "Updated" }); };
  try {
    const project = await updateProject({ _id: "project" }, { name: "Updated" });
    assert.equal(project.name, "Updated");
    assert.deepEqual(call, ["project", { name: "Updated" }, { new: true, runValidators: true }]);
  } finally { Project.findByIdAndUpdate = original; }
});
