# Decision logic and auditability

## Authoritative flow

The browser proposes a decision, but `decision.controller.js` owns the recorded snapshot. For `CURRENT_CONFIGURATION`, it recomputes risk and environment from the persisted mission. For `SCENARIO_SIMULATION`, it loads the referenced scenario `Assessment` belonging to that mission. Client-supplied configuration, risk, and environment fields are not trusted as audit values.

The reason is required, trimmed, and must have at least five characters (the schema caps it at 2,000). `Decision` stores configuration, risk, environment, reason, source, scenario ID, and timestamps.

| Requested decision | Current configuration status | Scenario status | Effect |
| --- | --- | --- | --- |
| APPROVE | `APPROVED` | `SCENARIO_APPROVED` | A scenario is staged; it is not applied yet. |
| REVIEW | `HOLD` | `PENDING_REVIEW` | Current configuration stays unchanged. |
| REJECT | `REJECTED` | `PENDING_REVIEW` | Current configuration stays unchanged. |

Only an APPROVE of a persisted `SCENARIO_SIMULATION` stores the scenario ID in the mission. `POST /api/missions/:id/apply-approved-scenario` verifies mission status, scenario ID, matching approval decision, saved scenario assessment, and the supported altitude/inclination/duration domain before replacing the configuration. The decision endpoint performs the same domain check and verifies finite 0–100 risk/environment snapshots with the implemented risk (`LOW`–`CRITICAL`) and environment (`LOW`/`MODERATE`/`ELEVATED`) levels before an older persisted scenario can be approved. Applying resets the mission to `PENDING_REVIEW`; the next analysis can create a `RISK_REASSESSMENT`. This is an application lifecycle safeguard, not operational authorization.

## Audit limits

Assessment history records initial assessments, scenario simulations, and configuration-change reassessments. It does not contain telemetry, signatures, user identity, external event data, or tamper-evident logging. MongoDB access control, backups, authentication, and immutability controls would be required before treating it as an operational audit trail.
