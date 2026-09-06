# Database design

`Mission` stores name, altitude, inclination, duration, timestamps, and current lifecycle state. Bounds are altitude 100–2000 km, inclination 0–180°, duration 1–3650 days.

`Assessment` stores `missionId`, type (`INITIAL_ASSESSMENT`, `SCENARIO_SIMULATION`, `RISK_REASSESSMENT`), risk/environment snapshots, configuration, summary, decision text, timestamps, and reproducibility metadata. New assessment records include a UUID `runId`, evaluation time, component model versions, and `MODELED`/`SIMULATED` provenance. A partial unique index permits one initial assessment per mission.

`Decision` stores an immutable-at-creation snapshot: mission ID, APPROVE/REVIEW/REJECT, configuration, risk, environment, required reason, source, optional scenario assessment ID, and timestamps. Mission lifecycle state is a convenience view of the latest meaningful disposition; the decision collection retains historical records.

The schema does not supply authentication, user identity, signatures, retention policy, encryption policy, or tamper-evidence. See [assumptions-and-limitations.md](assumptions-and-limitations.md).
