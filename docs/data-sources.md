# Data sources and provenance

## Current runtime inputs

OrbitGuard currently has no external runtime data source. The UI submits mission name, altitude, inclination, and duration; `Mission` persists them in MongoDB. All analysis, risk, and environment values are generated locally from those fields. They are not live telemetry, NASA data, tracked-object data, a space-weather feed, or an orbital catalog.

| Value | Runtime provenance | Qualification |
| --- | --- | --- |
| Mission configuration | User input → `Mission` | Schema bounds: 100–2000 km, 0–180°, 1–3650 days. |
| Radius, velocity, period | `orbitalAnalysis.service.js` | Circular two-body estimate. |
| Risk score | `risk.service.js` | Project-defined rule score, capped at 100. |
| Environment score | `spaceEnvironment.service.js` | Project-defined altitude/inclination heuristic. |
| Assessments and decisions | MongoDB snapshots | OrbitGuard audit records, not independently verified operations records. |

## Scientific references, not feeds

| Organization | Source | Concept supported | Why authoritative |
| --- | --- | --- | --- |
| NASA NTRS | [Preliminary orbital equations](https://ntrs.nasa.gov/api/citations/19770014192/downloads/19770014192.pdf) | Circular velocity and period | NASA technical archive. |
| NOAA SWPC | [Satellite Drag](https://www.swpc.noaa.gov/impacts/satellite-drag) | LEO drag and environmental variability | U.S. government space-weather authority. |
| NASA CARA | [Close Approach Risk Assessment](https://www.nasa.gov/cara/step-2-close-approach-risk-assessment/) | Screening versus collision likelihood/Pc | NASA conjunction-assessment program. |
| ESA | [Reentry and collision avoidance](https://www.esa.int/content/view/full/413425) | Operational data, uncertainty, and avoidance process | ESA Space Debris Office. |

These sources support concepts and limitations; the application does not call them at runtime. See [references.md](references.md) and [future-operational-architecture.md](future-operational-architecture.md).
