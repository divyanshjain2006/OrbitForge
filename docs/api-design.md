# API design

All endpoints are local Express endpoints under `/api`; response bodies use `success` plus the named payload.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | `/health` | Health response. |
| POST/GET | `/missions` | Create/list mission configurations. |
| GET/DELETE | `/missions/:id` | Retrieve/delete a mission. |
| POST | `/missions/:id/apply-approved-scenario` | Apply only the currently approved persisted scenario. |
| GET | `/analysis/:missionId` | Circular analysis and persisted baseline/reassessment. |
| GET | `/missions/:missionId/risk` | Current deterministic risk. |
| GET | `/intelligence/:missionId` | Risk/environment-derived narrative and actions. |
| GET | `/environment?altitude=&inclination=` | Modeled environment assessment. |
| POST | `/scenario/:missionId` | Evaluate and persist a proposed configuration. |
| GET | `/assessments/:missionId` | Assessment history, newest first. |
| GET/POST | `/decisions/:missionId` | Decision history or authoritative decision recording. |

Decision POST accepts only `decision`, `reason`, `source`, and optional `scenarioId`. The server recalculates current-configuration values or loads the saved scenario snapshot; it deliberately does not accept browser-provided assessment values. JSON bodies are limited to 32 KiB; mission/scenario bodies and environment query fields are allowlisted and finite bounded values; route IDs and scenario IDs must be MongoDB ObjectIds. Validation and semantics are in [decision-logic.md](decision-logic.md).
