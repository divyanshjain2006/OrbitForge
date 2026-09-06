# Data provenance and reproducibility

## Implemented

OrbitGuard has no external runtime data provider. Every analysis begins with a user-entered mission configuration stored in MongoDB. Therefore every returned analytical value is labelled by its generation mode rather than presented as measured or live.

| Output | Provenance status | Source / version |
| --- | --- | --- |
| Radius, velocity, period, revolutions | MODELED | Circular two-body model `1.1.0`; inputs are mission altitude and duration. |
| Risk score and factors | HEURISTIC | Deterministic rule engine `2.0.0`; inputs are altitude, inclination, duration. |
| Environment score and factors | HEURISTIC | Geometry rule model `1.0.0`; inputs are altitude and inclination. |
| Scenario result | SIMULATED | The same deterministic models evaluated against a saved alternate configuration. |

Each newly saved `Assessment` records a UUID `runId`, `evaluatedAt`, component model versions, and `MODELED` or `SIMULATED` provenance. The saved configuration plus this metadata makes a result reproducible against the same code/model versions. `INITIAL_ASSESSMENT` is intentionally deduplicated per mission; a repeated page load reuses it rather than pretending it is a new experiment.

## Not implemented

There is no `LIVE`, `VERIFIED`, `CACHED`, or `STALE` data status because OrbitGuard does not fetch external data. There is no dataset version, record identifier, source timestamp, coordinate frame, covariance, or telemetry provenance to report. Future providers must validate and normalize responses before storage, retain source URL/organization/retrieval time/units/transformations, and visibly mark cache or fallback use. They must never silently replace unavailable live data with modeled output.
