# Milestone 2B: Projects, Experiments, and Reproducible Runs

Projects organize scientific work inside one Workspace. A Project is `ACTIVE` or `ARCHIVED`; archival is non-destructive. Experiments belong to a Project and support the `MISSION_RISK_ANALYSIS` type. They are `DRAFT`, `ACTIVE`, `COMPLETED`, or `ARCHIVED`.

An ExperimentRun is a completed, immutable execution. The command validates finite, in-domain mission parameters and resolves every supplied DatasetVersion through its parent Dataset to the Experiment's Workspace. `VALID` versions are accepted; `VALID_WITH_WARNINGS` versions are accepted with that state preserved in provenance; `PENDING` and `INVALID` versions are rejected. The run stores exact DatasetVersion IDs, parameters, method/version, structured orbital/risk/environment outputs, execution timestamps, provenance, and the resulting ResearchRecord reference.

The initial deterministic method is `OrbitForge Deterministic Risk Engine` version `2.0.0`, type `HEURISTIC`. Its computation reuses the existing orbital analysis, risk, and space-environment services. It does not change mission data or make the NASA dataset drive the heuristic; DatasetVersions are governed inputs captured for reproducibility while dataset-to-model scientific coupling is deferred.

Successful execution creates an `EXPERIMENT_RUN` ResearchRecord and IntegrityManifest through the existing RFC 8785 JCS and SHA-256 integrity service. The hashed semantic payload includes method, validated parameters, structured deterministic results, experiment type, and stable dataset payload identities/validation state. Exact Mongo DatasetVersion references are retained on ExperimentRun and immutable provenance, but excluded from the semantic hash so database envelope IDs do not destabilize scientific identity. Verification uses the existing research-record verification API.

`POST /api/v1/experiment-runs/:id/reproduce` only accepts a completed run whose captured method is supported. It reuses its exact DatasetVersion IDs, parameters, optional mission link, and method version, creates a new immutable run and ResearchRecord, records `reproducedFromRunId`, and compares deterministic scientific results. It never changes the source run.

New APIs are protected under `/api/v1`. OWNER, ADMIN, and RESEARCHER can create, update, archive, execute, and reproduce. VIEWER is read-only. Project, Experiment, Run, DatasetVersion, and ResearchRecord access is resolved server-side back to Workspace membership. Audit events record project/experiment mutations and run start, completion, failure, and reproduction.

Scientific limits: CNEOS Scout data concerns preliminary, unconfirmed objects; DatasetVersion validation is structural/domain validation, not certification of scientific truth. The OrbitForge risk engine is heuristic: **HEURISTIC ≠ PROBABILITY**, **SIMULATION ≠ OBSERVATION**, and **MODELED ≠ MEASURED**. SHA-256 confirms content integrity, not authorship or authenticity. Reproduction confirms deterministic replay of captured computation, not correctness of the underlying scientific model.

Deferred: live Mongo integration tests, durable idempotency keys, transaction-backed multi-document creation, dataset-to-model scientific coupling, experiment scheduling, Projects for legacy resources, and frontend Research Lab screens.
