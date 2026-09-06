/**
 * OrbitForge — End-to-end integration test suite
 * 
 * Uses mongodb-memory-server as a temporary test database.
 * Does NOT modify backend routes, schemas, or production configuration.
 * Tests the real /api/v1 contracts against the real controllers.
 *
 * Usage:  node run-tests.mjs
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PASS = "securePassword123!"; // >= 12 chars per validateAuthBody

let mongod, server;
let ownerToken, adminToken, researcherToken, viewerToken;
let workspaceId, datasetId, projectId, experimentId, runId, recordId, datasetVersionId;
let otherWorkspaceId, researcherUserId;

const results = { passed: 0, failed: 0, tests: [], bugs: [] };

function log(name, ok, detail = "") {
  results.tests.push({ name, ok, detail });
  if (ok) { results.passed++; console.log(`  ✅ ${name}`); }
  else { results.failed++; console.log(`  ❌ ${name}: ${detail}`); }
}

async function apiFetch(endpoint, options = {}, token = null) {
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`http://localhost:5050/api/v1${endpoint}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, ok: res.ok, data };
}

async function setup() {
  process.env.JWT_SECRET = "integration-test-secret-that-is-at-least-32-chars";
  process.env.PORT = "5050";
  process.env.CORS_ORIGINS = "http://localhost:5173";

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (String(url) === "https://cneos.jpl.nasa.gov/scout.api") {
      return {
        ok: true,
        json: async () => ({
           data: [
             { objectName: "2024 SEED", nObs: "10", arc: "5", rating: "0", neoScore: "50", phaScore: "10" }
           ]
        })
      };
    }
    return originalFetch(url, options);
  };

  const appModule = await import('./src/app.js');
  const { connectDatabase } = await import('./src/config/database.js');
  await connectDatabase();
  server = appModule.default.listen(5050);

  // Seed users via the registration endpoint (which also creates a workspace)
  const { default: User } = await import('./src/models/user.model.js');
  const { default: Workspace } = await import('./src/models/workspace.model.js');

  // Seed via API: register the owner
  let res = await apiFetch('/auth/register', { method: 'POST', body: { email: "owner@test.com", password: PASS, displayName: "TestOwner" } });
  if (!res.ok) throw new Error("Owner registration failed: " + JSON.stringify(res.data));
  ownerToken = res.data.token;
  workspaceId = String(res.data.workspace._id);

  // Register other users, then add them to the owner's workspace
  res = await apiFetch('/auth/register', { method: 'POST', body: { email: "admin@test.com", password: PASS, displayName: "TestAdmin" } });
  adminToken = res.data.token;
  const adminUserId = String(res.data.user._id || res.data.user.id);

  res = await apiFetch('/auth/register', { method: 'POST', body: { email: "researcher@test.com", password: PASS, displayName: "TestResearcher" } });
  researcherToken = res.data.token;
  researcherUserId = String(res.data.user._id || res.data.user.id);

  res = await apiFetch('/auth/register', { method: 'POST', body: { email: "viewer@test.com", password: PASS, displayName: "TestViewer" } });
  viewerToken = res.data.token;
  const viewerUserId = String(res.data.user._id || res.data.user.id);

  // Owner adds other users to their workspace
  await apiFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: { userId: adminUserId, role: "ADMIN" } }, ownerToken);
  await apiFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: { userId: researcherUserId, role: "RESEARCHER" } }, ownerToken);
  await apiFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: { userId: viewerUserId, role: "VIEWER" } }, ownerToken);

  // Create a second, isolated workspace for cross-workspace testing
  res = await apiFetch('/auth/register', { method: 'POST', body: { email: "other@test.com", password: PASS, displayName: "OtherOwner" } });
  otherWorkspaceId = String(res.data.workspace._id);
}

async function teardown() {
  if (server) server.close();
  if (mongod) { await mongoose.disconnect(); await mongod.stop(); }
}

// ============================================================================
// 1. AUTHENTICATION
// ============================================================================
async function testAuthentication() {
  console.log("\n── 1. AUTHENTICATION ──");

  let res = await apiFetch('/auth/login', { method: 'POST', body: { email: "owner@test.com", password: PASS } });
  log("Valid login returns 200 + token", res.ok && !!res.data.token);

  res = await apiFetch('/auth/login', { method: 'POST', body: { email: "owner@test.com", password: "wrongpassword!!" } });
  log("Invalid password returns 401", res.status === 401, `got ${res.status}`);

  res = await apiFetch('/auth/login', { method: 'POST', body: { email: "nonexistent@test.com", password: PASS } });
  log("Non-existent email returns 401", res.status === 401, `got ${res.status}`);

  res = await apiFetch('/auth/login', { method: 'POST', body: { email: "owner@test.com", password: "short" } });
  log("Short password (< 12 chars) rejected by validation (400)", res.status === 400, `got ${res.status}`);

  res = await apiFetch('/auth/me', {}, ownerToken);
  log("Authenticated /me returns 200", res.ok && !!res.data.user, `got ${res.status}`);

  res = await apiFetch('/auth/me', {});
  log("Unauthenticated /me returns 401", res.status === 401, `got ${res.status}`);

  res = await apiFetch('/auth/me', {}, "invalid-token-value");
  log("Invalid token returns 401", res.status === 401, `got ${res.status}`);
}

// ============================================================================
// 2. WORKSPACE & ROLE AUTHORIZATION
// ============================================================================
async function testWorkspaceRoles() {
  console.log("\n── 2. WORKSPACE & ROLE AUTHORIZATION ──");

  let res = await apiFetch(`/workspaces`, {}, ownerToken);
  log("Owner can list workspaces", res.ok && Array.isArray(res.data.workspaces), `got ${res.status}`);

  res = await apiFetch(`/workspaces/${workspaceId}/datasets`, {}, viewerToken);
  log("VIEWER can read datasets", res.ok, `got ${res.status}`);

  // VIEWER cannot create project (requires ADMIN/RESEARCHER/OWNER)
  res = await apiFetch(`/workspaces/${workspaceId}/projects`, { method: 'POST', body: { name: "ViewerProject" } }, viewerToken);
  log("VIEWER cannot create project (403)", res.status === 403, `got ${res.status}`);

  // RESEARCHER can create project
  res = await apiFetch(`/workspaces/${workspaceId}/projects`, { method: 'POST', body: { name: "ResearcherProject" } }, researcherToken);
  log("RESEARCHER can create project", res.ok && !!res.data.project, `got ${res.status}`);
  if (res.ok) projectId = String(res.data.project._id);

  // Cross-workspace denial
  res = await apiFetch(`/workspaces/${otherWorkspaceId}/projects`, { method: 'POST', body: { name: "CrossProject" } }, researcherToken);
  log("Cross-workspace access denied (403)", res.status === 403, `got ${res.status}`);

  res = await apiFetch(`/workspaces/${otherWorkspaceId}/datasets`, {}, viewerToken);
  log("Cross-workspace read denied (403)", res.status === 403, `got ${res.status}`);
}

// ============================================================================
// 3. DATASETS & VERSIONS
// ============================================================================
async function testDatasets() {
  console.log("\n── 3. DATASETS & VERSIONS ──");

  // Create dataset
  let res = await apiFetch(`/workspaces/${workspaceId}/datasets`, { method: 'POST', body: { name: "CNEOS Scout Test" } }, researcherToken);
  log("Create dataset", res.ok && !!res.data.dataset, `status=${res.status} ${JSON.stringify(res.data?.error)}`);
  if (res.ok) datasetId = String(res.data.dataset._id);

  res = await apiFetch(`/workspaces/${workspaceId}/datasets`, {}, researcherToken);
  log("List datasets", res.ok && Array.isArray(res.data.datasets), `got ${res.status}`);

  res = await apiFetch(`/datasets/${datasetId}`, {}, researcherToken);
  log("Get dataset by ID", res.ok && !!res.data.dataset, `got ${res.status}`);

  // Ingest — this calls CNEOS Scout API; may fail in CI
  res = await apiFetch(`/datasets/${datasetId}/ingest`, { method: 'POST' }, researcherToken);
  if (res.ok && res.data.datasetVersion) {
    log("Ingest dataset (CNEOS Scout)", true);
    datasetVersionId = String(res.data.datasetVersion._id);

    // List versions
    res = await apiFetch(`/datasets/${datasetId}/versions`, {}, researcherToken);
    log("List dataset versions", res.ok && Array.isArray(res.data.versions) && res.data.versions.length > 0, `got ${res.status}`);

    // Get single version
    res = await apiFetch(`/dataset-versions/${datasetVersionId}`, {}, researcherToken);
    log("Get dataset version by ID", res.ok && !!res.data.datasetVersion, `got ${res.status}`);

    // Validate version
    res = await apiFetch(`/dataset-versions/${datasetVersionId}/validate`, { method: 'POST' }, researcherToken);
    log("Validate dataset version", res.ok && !!res.data.validationRun, `got ${res.status}`);

    // List validations
    res = await apiFetch(`/dataset-versions/${datasetVersionId}/validation-runs`, {}, researcherToken);
    log("List validation runs", res.ok && Array.isArray(res.data.validationRuns), `got ${res.status}`);
  } else {
    log("Ingest dataset (CNEOS Scout) — may fail without network", false, `status=${res.status} ${JSON.stringify(res.data?.error)}`);
    results.bugs.push("CNEOS Scout ingestion unavailable (network dependency) — cannot test downstream version/run/record flow without seed data");
    // Manual seed via direct DB insert so we can continue the rest of the flow
    const { default: DatasetVersion } = await import('./src/models/datasetVersion.model.js');
    const dv = await DatasetVersion.create({
      datasetId,
      version: 1,
      sourceUri: "https://cneos.jpl.nasa.gov/scout.api",
      normalizedPayload: { test: true },
      normalizedPayloadHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      rawPayload: { test: true },
      rawPayloadHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      canonicalizationVersion: "1.0",
      ingestionVersion: "1.0",
      provenance: { source: "test" },
      createdBy: mongoose.Types.ObjectId.createFromHexString(researcherUserId),
      retrievedAt: new Date(),
      validationStatus: "VALID"
    });
    datasetVersionId = String(dv._id);
    log("Fallback: seeded dataset version directly", true);
  }

  // VIEWER cannot ingest
  res = await apiFetch(`/datasets/${datasetId}/ingest`, { method: 'POST' }, viewerToken);
  log("VIEWER cannot ingest dataset (403)", res.status === 403, `got ${res.status}`);
}

// ============================================================================
// 4. PROJECTS & EXPERIMENTS
// ============================================================================
async function testProjectsExperiments() {
  console.log("\n── 4. PROJECTS & EXPERIMENTS ──");

  // Use the projectId from the roles test
  let res = await apiFetch(`/workspaces/${workspaceId}/projects`, {}, researcherToken);
  log("List projects", res.ok && Array.isArray(res.data.projects), `got ${res.status}`);

  res = await apiFetch(`/projects/${projectId}`, {}, researcherToken);
  log("Get project by ID", res.ok && !!res.data.project, `got ${res.status}`);

  // Create experiment
  res = await apiFetch(`/projects/${projectId}/experiments`, {
    method: 'POST',
    body: { name: "Risk Analysis Exp", type: "MISSION_RISK_ANALYSIS" }
  }, researcherToken);
  log("Create experiment", res.ok && !!res.data.experiment, `status=${res.status} ${JSON.stringify(res.data?.error)}`);
  if (res.ok) experimentId = String(res.data.experiment._id);

  res = await apiFetch(`/projects/${projectId}/experiments`, {}, researcherToken);
  log("List experiments", res.ok && Array.isArray(res.data.experiments), `got ${res.status}`);

  res = await apiFetch(`/experiments/${experimentId}`, {}, researcherToken);
  log("Get experiment by ID", res.ok && !!res.data.experiment, `got ${res.status}`);

  // VIEWER cannot create experiment
  res = await apiFetch(`/projects/${projectId}/experiments`, {
    method: 'POST',
    body: { name: "VExp", type: "MISSION_RISK_ANALYSIS" }
  }, viewerToken);
  log("VIEWER cannot create experiment (403)", res.status === 403, `got ${res.status}`);
}

// ============================================================================
// 5. EXPERIMENT RUNS
// ============================================================================
async function testExperimentRuns() {
  console.log("\n── 5. EXPERIMENT RUNS ──");

  if (!experimentId || !datasetVersionId) {
    log("SKIP: no experiment or dataset version", false, "Missing prerequisites");
    return;
  }

  // Create experiment run
  let res = await apiFetch(`/experiments/${experimentId}/runs`, {
    method: 'POST',
    body: {
      datasetVersionIds: [datasetVersionId],
      parameters: { altitudeKm: 400, inclinationDeg: 51.6, durationDays: 365 }
    }
  }, researcherToken);
  log("Create experiment run",
    res.ok && !!res.data.experimentRun,
    `status=${res.status} ${JSON.stringify(res.data?.error)}`);
  if (res.ok) {
    runId = String(res.data.experimentRun._id);
    if (res.data.researchRecord) {
      recordId = String(res.data.researchRecord._id);
    }
  }

  // Get run detail — verify response shape
  res = await apiFetch(`/experiment-runs/${runId}`, {}, researcherToken);
  log("Get run detail — has experimentRun", res.ok && !!res.data.experimentRun, `got ${res.status}`);
  log("Get run detail — has datasetVersions array", res.ok && Array.isArray(res.data.datasetVersions));
  log("Get run detail — has researchRecord", res.ok && !!res.data.researchRecord);
  log("Get run detail — has reproduction field", res.ok && res.data.reproduction !== undefined);
  if (res.ok && res.data.researchRecord) {
    recordId = String(res.data.researchRecord.id || res.data.researchRecord._id);
  }

  // List runs
  res = await apiFetch(`/experiments/${experimentId}/runs`, {}, researcherToken);
  log("List experiment runs", res.ok && Array.isArray(res.data.experimentRuns), `got ${res.status}`);

  // VIEWER cannot create run
  res = await apiFetch(`/experiments/${experimentId}/runs`, {
    method: 'POST',
    body: {
      datasetVersionIds: [datasetVersionId],
      parameters: { altitudeKm: 400, inclinationDeg: 51.6, durationDays: 365 }
    }
  }, viewerToken);
  log("VIEWER cannot create run (403)", res.status === 403, `got ${res.status}`);
}

// ============================================================================
// 6. REPRODUCTION
// ============================================================================
async function testReproduction() {
  console.log("\n── 6. REPRODUCTION ──");

  if (!runId) { log("SKIP: no run to reproduce", false, "Missing runId"); return; }

  let res = await apiFetch(`/experiment-runs/${runId}/reproduce`, { method: 'POST' }, researcherToken);
  log("Reproduce run — 201", res.status === 201 && !!res.data.experimentRun, `status=${res.status} ${JSON.stringify(res.data?.error)}`);
  if (res.ok) {
    log("Reproduction — has experimentRun", !!res.data.experimentRun);
    log("Reproduction — has researchRecord", !!res.data.researchRecord);
    log("Reproduction — reproduction field exists", !!res.data.experimentRun.reproduction);
    if (res.data.experimentRun.reproduction) {
      log("Reproduction — deterministicMatch is boolean",
        typeof res.data.experimentRun.reproduction.resultMatch === "boolean");
    }
  }
}

// ============================================================================
// 7. RESEARCH RECORDS & TRUST
// ============================================================================
async function testTrust() {
  console.log("\n── 7. RESEARCH RECORDS & TRUST ──");

  if (!recordId) { log("SKIP: no research record", false, "Missing recordId"); return; }

  // Get research record
  let res = await apiFetch(`/research-records/${recordId}`, {}, researcherToken);
  log("Get research record", res.ok && !!res.data.researchRecord, `got ${res.status}`);
  log("Record has integrityManifest", res.ok && !!res.data.integrityManifest);
  log("Record has integrity object", res.ok && !!res.data.integrity);
  if (res.ok && res.data.integrity) {
    log("Integrity status is string", typeof res.data.integrity.status === "string",
      `status=${res.data.integrity.status}`);
    log("Integrity status is NOT_VERIFIED before first verify",
      res.data.integrity.status === "NOT_VERIFIED",
      `got ${res.data.integrity.status}`);
  }

  // Verify
  res = await apiFetch(`/research-records/${recordId}/verify`, { method: 'POST' }, researcherToken);
  log("Verify research record", res.ok && !!res.data.verification, `status=${res.status} ${JSON.stringify(res.data?.error)}`);
  if (res.ok) {
    log("Verification event has result", !!res.data.verification.result);
    log("Verification event has algorithm", !!res.data.verification.algorithm);
    log("Verification event has computedHash", !!res.data.verification.computedHash);
    log("Verification event has expectedHash", !!res.data.verification.expectedHash);
  }

  // Re-fetch record to confirm status updated
  res = await apiFetch(`/research-records/${recordId}`, {}, researcherToken);
  if (res.ok && res.data.integrity) {
    log("Post-verify integrity status is VERIFIED or FAILED",
      ["VERIFIED", "FAILED"].includes(res.data.integrity.status),
      `got ${res.data.integrity.status}`);
  }

  // List verifications
  res = await apiFetch(`/research-records/${recordId}/verifications`, {}, researcherToken);
  log("List verification events", res.ok && Array.isArray(res.data.verifications), `got ${res.status}`);
  if (res.ok) {
    log("At least 1 verification event exists", res.data.verifications.length >= 1,
      `got ${res.data.verifications.length}`);
  }

  // Provenance
  res = await apiFetch(`/research-records/${recordId}/provenance`, {}, researcherToken);
  log("Get provenance", res.ok && !!res.data.provenance, `got ${res.status}`);
}

// ============================================================================
// 8. RESEARCH WORKSPACE (experimentResearch response shape)
// ============================================================================
async function testResearchWorkspace() {
  console.log("\n── 8. RESEARCH WORKSPACE ──");

  let res = await apiFetch(`/workspaces/${workspaceId}/research/overview`, {}, researcherToken);
  log("Research overview", res.ok && !!res.data.overview, `got ${res.status}`);

  if (projectId) {
    res = await apiFetch(`/projects/${projectId}/research`, {}, researcherToken);
    log("Project research view returns { research }",
      res.ok && !!res.data.research,
      `got ${res.status}, keys: ${Object.keys(res.data).join(',')}`);
    if (res.ok && res.data.research) {
      log("Project research — has project", !!res.data.research.project);
      log("Project research — has experiments", Array.isArray(res.data.research.experiments));
    }
  }

  if (experimentId) {
    res = await apiFetch(`/experiments/${experimentId}/research`, {}, researcherToken);
    log("Experiment research view returns { research }",
      res.ok && !!res.data.research,
      `got ${res.status}, keys: ${Object.keys(res.data).join(',')}`);
    if (res.ok && res.data.research) {
      log("Experiment research — has experiment", !!res.data.research.experiment);
      log("Experiment research — has project obj", !!res.data.research.project);
      log("Experiment research — has latestRuns (not 'runs')", Array.isArray(res.data.research.latestRuns),
        `keys: ${Object.keys(res.data.research).join(',')}`);
      log("Experiment research — has runSummary", !!res.data.research.runSummary);
    }
  }

  // Search
  res = await apiFetch(`/workspaces/${workspaceId}/research/search?q=Risk`, {}, researcherToken);
  log("Research search", res.ok && Array.isArray(res.data.resources), `got ${res.status}`);
}

// ============================================================================
// 9. TAMPER DETECTION
// ============================================================================
async function testTamperDetection() {
  console.log("\n── 9. TAMPER DETECTION ──");

  if (!recordId) { log("SKIP: tamper detection (no record)", false, "Missing recordId"); return; }

  // Tamper with the semantic payload in the DB directly
  const { default: ResearchRecord } = await import('./src/models/researchRecord.model.js');
  const original = await ResearchRecord.findById(recordId).lean();
  if (!original) { log("SKIP: tamper detection — record not found", false); return; }

  // Use updateOne with $set to bypass immutability guard on new documents
  // We'll create a separate record to tamper with
  const { default: IntegrityManifest } = await import('./src/models/integrityManifest.model.js');
  const tamperedRecordId = new mongoose.Types.ObjectId();
  const tamperedManifestId = new mongoose.Types.ObjectId();
  
  // Modify the existing record in place using updateOne to bypass immutability hooks
  const tamperedPayload = { ...original.semanticPayload, tampered: true };
  await ResearchRecord.collection.updateOne(
    { _id: original._id },
    { $set: { semanticPayload: tamperedPayload } }
  );
  
  // Verify the tampered record — should produce FAILED
  let res = await apiFetch(`/research-records/${recordId}/verify`, { method: 'POST' }, researcherToken);
  log("Tampered record verify returns 200", res.ok, `got ${res.status}`);
  if (res.ok && res.data.verification) {
    log("Tampered verification result is FAILED", res.data.verification.result === "FAILED",
      `got ${res.data.verification.result}`);
    log("Tampered computedHash differs from expectedHash",
      res.data.verification.computedHash !== res.data.verification.expectedHash);
  }

  // Check integrity status is FAILED after tampering
  res = await apiFetch(`/research-records/${recordId}`, {}, researcherToken);
  if (res.ok && res.data.integrity) {
    log("Post-tamper integrity status is FAILED",
      res.data.integrity.status === "FAILED", `got ${res.data.integrity.status}`);
  }

  // Restore the original payload
  await ResearchRecord.collection.updateOne(
    { _id: original._id },
    { $set: { semanticPayload: original.semanticPayload } }
  );

  // Verify original untampered record again
  res = await apiFetch(`/research-records/${recordId}/verify`, { method: 'POST' }, researcherToken);
  res = await apiFetch(`/research-records/${recordId}`, {}, researcherToken);
  if (res.ok && res.data.integrity) {
    log("Original record integrity restored to VERIFIED",
      res.data.integrity.status === "VERIFIED", `got ${res.data.integrity.status}`);
  }
}

// ============================================================================
// 10. DATASET VALIDATION COVERAGE
// ============================================================================
async function testDatasetValidation() {
  console.log("\n── 10. DATASET VALIDATION ──");

  if (!datasetVersionId) { log("SKIP: dataset validation (no version)", false); return; }

  // Get the dataset version — check it was marked as VALID after validation
  let res = await apiFetch(`/dataset-versions/${datasetVersionId}`, {}, researcherToken);
  if (res.ok && res.data.datasetVersion) {
    log("DatasetVersion has validationStatus",
      typeof res.data.datasetVersion.validationStatus === "string",
      `status=${res.data.datasetVersion.validationStatus}`);
    log("DatasetVersion has rawPayloadHash",
      typeof res.data.datasetVersion.rawPayloadHash === "string" && res.data.datasetVersion.rawPayloadHash.startsWith("sha256:"));
    log("DatasetVersion has normalizedPayloadHash",
      typeof res.data.datasetVersion.normalizedPayloadHash === "string" && res.data.datasetVersion.normalizedPayloadHash.startsWith("sha256:"));
    log("DatasetVersion has provenance object", !!res.data.datasetVersion.provenance);
    log("DatasetVersion has canonicalizationVersion", typeof res.data.datasetVersion.canonicalizationVersion === "string");
    log("DatasetVersion has ingestionVersion", typeof res.data.datasetVersion.ingestionVersion === "string");
  }
}

// ============================================================================
// 11. ERROR CODES
// ============================================================================
async function testErrors() {
  console.log("\n── 11. ERROR CODES ──");

  // 400 — bad ObjectId
  let res = await apiFetch('/experiment-runs/not-a-valid-id', {}, researcherToken);
  log("400 for invalid ObjectId", res.status === 400, `got ${res.status}`);

  // 404 — non-existent but valid ObjectId
  res = await apiFetch('/experiment-runs/aaaaaaaaaaaaaaaaaaaaaaaa', {}, researcherToken);
  log("404 for non-existent run", res.status === 404, `got ${res.status}`);

  // 403 — cross-workspace
  res = await apiFetch(`/workspaces/${otherWorkspaceId}/projects`, {}, researcherToken);
  log("403 for cross-workspace read", res.status === 403, `got ${res.status}`);

  // 409 — duplicate registration
  res = await apiFetch('/auth/register', { method: 'POST', body: { email: "owner@test.com", password: PASS, displayName: "Dupe" } });
  log("409 for duplicate email registration", res.status === 409, `got ${res.status}`);

  // VIEWER cannot verify research records
  if (recordId) {
    res = await apiFetch(`/research-records/${recordId}/verify`, { method: 'POST' }, viewerToken);
    log("VIEWER cannot verify research record (403)", res.status === 403, `got ${res.status}`);
  }

  // VIEWER cannot reproduce runs
  if (runId) {
    res = await apiFetch(`/experiment-runs/${runId}/reproduce`, { method: 'POST' }, viewerToken);
    log("VIEWER cannot reproduce run (403)", res.status === 403, `got ${res.status}`);
  }

  // Invalid dataset version in experiment run
  if (experimentId) {
    res = await apiFetch(`/experiments/${experimentId}/runs`, {
      method: 'POST',
      body: {
        datasetVersionIds: ["aaaaaaaaaaaaaaaaaaaaaaaa"],
        parameters: { altitudeKm: 400, inclinationDeg: 51.6, durationDays: 365 }
      }
    }, researcherToken);
    log("Invalid datasetVersionId rejected", !res.ok, `got ${res.status}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  try {
    console.log("=== OrbitForge Integration Test Suite ===\n");
    await setup();

    await testAuthentication();
    await testWorkspaceRoles();
    await testDatasets();
    await testProjectsExperiments();
    await testExperimentRuns();
    await testReproduction();
    await testTrust();
    await testResearchWorkspace();
    await testTamperDetection();
    await testDatasetValidation();
    await testErrors();

    console.log("\n" + "=".repeat(55));
    console.log(`  PASSED: ${results.passed}`);
    console.log(`  FAILED: ${results.failed}`);
    console.log(`  TOTAL:  ${results.tests.length}`);
    console.log("=".repeat(55));

    if (results.bugs.length) {
      console.log("\n── REPORTED ISSUES ──");
      results.bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
    }

    const failures = results.tests.filter(t => !t.ok);
    if (failures.length) {
      console.log("\n── FAILED TESTS ──");
      failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.detail}`));
    }
  } catch (err) {
    console.error("\nFATAL:", err);
  } finally {
    await teardown();
  }
}

main();
