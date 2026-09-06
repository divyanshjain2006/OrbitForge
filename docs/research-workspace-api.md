# Research Workspace API Contract

All endpoints are authenticated `/api/v1` read APIs. OWNER, ADMIN, RESEARCHER, and VIEWER can browse only resources resolved by the server to their workspace membership.

## Overview

`GET /workspaces/:workspaceId/research/overview` returns workspace metadata and compact counts for projects, datasets/versions, experiments, experiment runs, and research-record integrity states.

## Research views

- `GET /projects/:id/research` returns a project plus compact experiments, workspace missions/datasets, recent runs, and integrity summaries.
- `GET /experiments/:id/research` returns experiment/project metadata, run counts, exact DatasetVersion summaries, and latest run summaries.
- `GET /experiment-runs/:id` returns the immutable run, DatasetVersion summaries, ResearchRecord integrity, provenance, result, method, parameters, and reproduction relationship.
- `GET /research-records/:id` now returns `integrity` alongside the manifest. `VERIFIED` or `FAILED` only come from a real VerificationEvent; a manifest without an event is `NOT_VERIFIED`.
- `GET /research-records/:id/provenance` returns the existing lightweight PROV-inspired record provenance and semantic payload.

## Search

`GET /workspaces/:workspaceId/research/search?q=&type=&projectId=&status=&limit=&cursor=` searches compact `PROJECT`, `DATASET`, `EXPERIMENT`, `EXPERIMENT_RUN`, `RESEARCH_RECORD`, and `MISSION` summaries within one workspace. `limit` is 1–50 (default 20); ordering is newest-first with ID as a stable tie breaker. `nextCursor` is opaque and should be passed unchanged to retrieve the next page.

Example response:

```json
{
  "success": true,
  "resources": [{ "id": "...", "type": "EXPERIMENT", "name": "Risk study", "status": "ACTIVE", "createdAt": "..." }],
  "nextCursor": null
}
```

Invalid filters return `400 INVALID_RESEARCH_FILTER`; malformed cursors return `400 INVALID_CURSOR`; unauthorized workspace access follows the existing `403 WORKSPACE_ACCESS_DENIED` response. The APIs do not create, verify, ingest, or modify data.

Provenance and integrity are views over existing DatasetVersion, ExperimentRun, ResearchRecord, IntegrityManifest, and VerificationEvent records. A digest is an integrity reference, not proof of authorship or scientific correctness.
