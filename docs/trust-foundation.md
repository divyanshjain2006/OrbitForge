# Milestone 1A: Trust Foundation

`POST /api/v1/missions/:missionId/analysis-runs` is the explicit command that runs the existing deterministic orbital, risk, and environmental services using the mission configuration loaded from MongoDB. It does not accept client-supplied outputs, hashes, or provenance. Each POST represents a distinct execution and intentionally creates a new run and research record; this preserves an execution audit trail without requiring distributed idempotency infrastructure.

The command creates an `AnalysisRun`, then a `ResearchRecord` and its `IntegrityManifest`. If the record/manifest stage fails in a standalone MongoDB deployment, the service removes the newly-created manifest and marks the run failed. MongoDB transactions are not required because the current project does not establish replica-set transaction support.

The Research Record's `semanticPayload` contains the server snapshot of mission inputs, deterministic orbital/risk/environment outputs, model versions, and lightweight W3C PROV-inspired provenance. Provenance is JSON rather than RDF: an input Entity, an analysis Activity with timestamps, the OrbitForge backend Agent, and `used`, `wasGeneratedBy`, `wasAssociatedWith`, and `wasDerivedFrom` relationships.

Semantic payloads are serialized with the `canonicalize` npm package (v2.x), an RFC 8785 JSON Canonicalization Scheme implementation, under the explicit `RFC8785-JCS` version label. Non-finite numbers are rejected before canonicalization. SHA-256 is computed over only `semanticPayload`; Mongo `_id`, `__v`, run/record/manifest identifiers, manifest metadata, verification times, and the digest itself are excluded. Digests use `sha256:` followed by 64 lowercase hexadecimal characters.

Read-only APIs are:

- `GET /api/v1/analysis-runs/:id`
- `GET /api/v1/research-records/:id`
- `GET /api/v1/research-records/:id/verifications`

`POST /api/v1/research-records/:id/verify` recomputes the digest without repairing the stored manifest and appends a `VerificationEvent` with `VERIFIED` or `FAILED`. Research Records and Integrity Manifests have no update/delete routes and their schemas reject normal document saves after creation. Verification Events are append-only.

Integrity verification confirms that the semantic research payload has not changed since the recorded digest was created. SHA-256 alone does not establish authorship, identity, or authenticity.

Deferred: authentication, tenants/RBAC, NASA ingestion, blockchain/digital signatures, RDF/graph storage, AI/ML, microservices, and a major frontend refactor.
