# Scientific models

## Scope and evidence boundary

OrbitGuard is a mission-planning prototype. It combines a circular two-body orbital calculation with deterministic, explainable configuration rules. Mission altitude, inclination, and duration are user inputs stored in MongoDB; they are not an ephemeris, telemetry stream, catalog object, or NASA data product.

The only physics calculation currently implemented is in `server/src/services/analysis/orbitalAnalysis.service.js`. Risk and environment outputs are **heuristic decision-support indices**, not measurements, probabilities, or validated safety limits.

## Circular-orbit calculation

### Inputs and constants

`calculateOrbitalAnalysis(mission)` accepts finite altitude `h` (100–2000 km), inclination (0–180°), and duration (1–3650 days). It uses Earth reference radius `R = 6378.137 km` and Earth standard gravitational parameter `μ = 398600.4418 km³/s²`.

The implementation calculates orbital radius `r = R + h`. For a circular orbit, semi-major axis `a = r`, so it uses the circular form of vis-viva, `v = √(μ / r)`, and period `T = 2π√(r³ / μ)`. The service returns `T / 60` minutes, `86400 / T` revolutions/day, and `round(revolutions/day × durationDays)` estimated revolutions. Radius and period are rounded to three decimals; velocity to four. NASA’s preliminary-design equations give the same circular-velocity and period relationships for a single central inverse-square field [NASA NTRS](https://ntrs.nasa.gov/api/citations/19770014192/downloads/19770014192.pdf).

### Interpretation and limits

These are first-order circular, two-body estimates. They do not propagate a state vector and do not model eccentricity, RAAN, argument of perigee, true anomaly, J2, third bodies, solar-radiation pressure, maneuvers, drag integration, density variation, or uncertainty. They must not be used as precision ephemerides, maneuver design, re-entry prediction, or collision-avoidance outputs. Inclination is persisted and validated but does not enter velocity or period; it is only used by the rules below.

## Modeled environmental assessment

`assessSpaceEnvironment` accepts altitude and inclination, adds two rule scores, caps their sum at 100, and labels it LOW (<10), MODERATE (10–24), or ELEVATED (≥25).

| Factor | Exact implemented rule | Meaning |
| --- | --- | --- |
| Atmospheric drag | altitude <250: 30; <300: 24; <450: 14; ≤800: 0; >800: 3 | Qualitative drag-exposure flag |
| Radiation | +6 if altitude >800; +5 if inclination >90 | Qualitative geometry-context flag |

It does **not** calculate density, ballistic coefficient, drag force, lifetime, particle spectra, dose, total ionizing dose, single-event effects, solar activity, or geomagnetic activity. NOAA explains that LEO drag varies with thermospheric density and solar/geomagnetic activity; those inputs are absent here [NOAA SWPC](https://www.swpc.noaa.gov/impacts/satellite-drag). The score is therefore an OrbitGuard-defined screening signal, not a space-weather severity, density measurement, radiation measurement, or dose prediction.

## Relationship to conjunction assessment

OrbitGuard calculates no close approaches, miss distances, object states, covariance matrices, conjunction data messages, hard-body radii, or probability of collision (Pc). A close approach is a screening result; NASA notes it does not by itself establish collision risk. Pc uses predicted ephemerides and their uncertainties, and is distinct from OrbitGuard’s 0–100 score [NASA CARA](https://www.nasa.gov/cara/step-2-close-approach-risk-assessment/). No OrbitGuard score, level, decision, or scenario comparison may be described as Pc or an operational conjunction assessment.
