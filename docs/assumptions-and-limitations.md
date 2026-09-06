# Assumptions and limitations

## Explicit assumptions

- The orbital display assumes a circular Earth orbit and uses altitude above a fixed Earth radius.
- All risk/environment inputs are static mission configuration values.
- Environmental rules assume altitude is a useful qualitative drag indicator and altitude/inclination are useful qualitative radiation-context indicators.
- Scenario comparison assumes the deterministic rules are meaningful only as an internal before/after comparison.

## Important limitations

- No external data, telemetry, state vector, ephemeris, TLE, object catalog, live space-weather feed, or NASA data is ingested.
- No atmospheric density, ballistic coefficient, drag propagation, orbital lifetime, radiation dose, shielding, or spacecraft design attribute is modeled.
- No conjunction screening, miss distance, covariance, hard-body radius, TCA, collision consequence, Pc, maneuver, or collision avoidance is calculated.
- Rule scores and thresholds are uncalibrated product heuristics, not empirical probabilities or mission-assurance limits.
- Assessment run IDs and model versions support repeatability of the local model, but they do not establish independent validation or data lineage.
- Decision records are application-level history, not authenticated, signed, access-controlled, or tamper-evident operational records.

The UI and documentation must use “modeled,” “heuristic,” “deterministic,” and “prototype” where applicable. They must not imply live measurements, NASA operations, flight certification, or operational readiness.
