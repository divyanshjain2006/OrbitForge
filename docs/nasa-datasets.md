# Milestone 2A: NASA Dataset Foundation

OrbitForge introduces a governed data path: CNEOS Scout source → server-side ingestion → raw payload → DatasetVersion → validation → provenance and SHA-256 identities. The first source is the official allowlisted Scout endpoint, `https://cneos.jpl.nasa.gov/scout.api`. The frontend never fetches NASA directly, and clients cannot submit arbitrary URLs.

A Dataset belongs to exactly one workspace. A DatasetVersion is immutable apart from its recorded validation status and receives a sequential version number within its Dataset. It stores the raw Scout JSON, a normalized adapter output, two separate `sha256:` identities, retrieval time, source URI, adapter/ingestion version, and lightweight PROV-inspired provenance. Database IDs, document metadata, and hash envelopes are not included in either identity.

`POST /api/v1/workspaces/:workspaceId/datasets` creates a CNEOS Scout dataset. `POST /api/v1/datasets/:id/ingest` creates a new version and an initial ValidationRun. `POST /api/v1/dataset-versions/:id/validate` appends another validation observation; GET endpoints do not fetch, mutate, or validate data. Viewers may read. Researchers, admins, and owners may create, ingest, and validate. Every resource lookup verifies membership in the Dataset's workspace.

The Scout adapter is deliberately isolated under `server/src/services/nasa/`. It accepts recognized Scout collections and produces OrbitForge's normalized object collection. Malformed data, non-finite source numerics, non-JSON responses, non-success HTTP responses, and timeouts fail ingestion rather than being silently stored. An in-process 30-second per-dataset cooldown prevents uncontrolled repeated requests; it is not distributed rate limiting.

Validation statuses are `VALID`, `VALID_WITH_WARNINGS`, and `INVALID`. The current validator checks for a normalized object collection and unique non-empty designations; an empty response or missing optional observational metadata creates warnings. It does not alter NASA source content.

Scout data describe recently detected, unconfirmed NEO candidates and should not be treated as a complete scientific validation of any downstream mission or risk interpretation. OrbitForge does not yet use dataset versions to drive missions, scenarios, or experiments.

Known limitations: no durable/raw-object blob store, pagination policy, distributed ingestion rate limiting, background jobs, NASA API key support, dataset-to-experiment linking, or DONKI/JPL SBDB integration. Those belong to later milestones.
