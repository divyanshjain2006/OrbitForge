# Scenario simulation

`POST /api/scenario/:missionId` validates a proposed altitude (100–2000 km), inclination (0–180°), and duration (1–3650 days) in `scenario.service.js`. It evaluates the current persisted configuration and proposed configuration with the same risk and environment services.

The response includes two snapshots plus:

- risk delta: proposed score − current score;
- environment delta: proposed score − current score;
- per-category score comparisons;
- `IMPROVED`, `WORSENED`, or `UNCHANGED` direction for each; and
- an overall scenario label: IMPROVED only when both deltas improve, WORSENED when both worsen, UNCHANGED when both are unchanged, otherwise MIXED IMPACT.

The server persists each proposed configuration as a `SCENARIO_SIMULATION` assessment before returning its ID. A scenario does not mutate the mission. The user must explicitly select it, record a decision, and—only after scenario approval—apply it. Deltas compare OrbitGuard’s deterministic outputs only; they do not predict actual performance improvement, collision risk reduction, fuel use, or mission success.
