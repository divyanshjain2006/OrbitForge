# Architecture and dependency graph

OrbitGuard is a React/Vite client, Express API, and MongoDB persistence layer. The implementation graph is:

```text
Mission configuration (Mission)
  ├─→ orbitalAnalysis.service → radius/velocity/period/revolutions
  ├─→ risk.service → deterministic score/factors/posture
  └─→ spaceEnvironment.service → modeled drag/radiation context
                         ↓
 missionIntelligence.service → narrative/readiness/actions
                         ↓
 scenario.service → baseline/proposed snapshots, deltas, comparison
                         ↓
 decision.controller → authoritative Decision snapshot + Mission lifecycle
                         ↓
 apply-approved-scenario → Mission configuration replacement → reassessment
                         ↓
 Assessment and Decision history
```

Key code: `server/src/services/analysis/orbitalAnalysis.service.js`, `risk.service.js`, `spaceEnvironment/spaceEnvironment.service.js`, `scenario.service.js`, `intelligence/missionIntelligence.service.js`, and controllers/routes. `Mission`, `Assessment`, and `Decision` are Mongoose models. The client calls `/api` through Vite’s development proxy and renders `Dashboard`, `Analysis`, `ScenarioSimulator`, and `OrbitVisualization`.

Analysis persists one `INITIAL_ASSESSMENT` per mission and a new `RISK_REASSESSMENT` only for a changed configuration; scenario calls persist `SCENARIO_SIMULATION`. New assessment records include a UUID run ID, evaluation timestamp, model versions, and `MODELED`/`SIMULATED` provenance. Mission deletion removes associated assessment and decision records. See [decision-logic.md](decision-logic.md) for state transitions, [data-provenance.md](data-provenance.md) for reproducibility, and [scientific-models.md](scientific-models.md) for model boundaries.
