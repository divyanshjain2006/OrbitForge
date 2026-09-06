# Scientific and input validation

## Deterministic calculation check

The service test `server/test/scientific-validation.test.js` derives a 400 km circular-orbit reference directly from the constants used by OrbitGuard: `R = 6378.137 km`, `μ = 398600.4418 km³/s²`, and `r = R + 400 km`. It accepts these rounded outputs:

| Quantity | Expected | Acceptance criterion | Basis |
| --- | ---: | --- | --- |
| Radius | 6778.137 km | Exact to service precision | `r = R + h` |
| Circular velocity | 7.6686 km/s | Exact to service precision | `v = √(μ/r)` |
| Period | 92.560 min | Exact to service precision | `T = 2π√(r³/μ)` |
| Revolutions/day | 15.558 | Exact to service precision | `86400/T` |

This is an algebraic regression check for the declared circular two-body model, not an orbital-propagation validation. The scientific context and source are documented in [scientific-models.md](scientific-models.md) and [references.md](references.md).

## Boundary and lifecycle checks

The automated suite also checks rejection of non-finite and out-of-domain inputs, scenario bounds, server-authoritative decision snapshots, decision status mapping, approved-scenario staging, and deletion cleanup. The API independently rejects malformed JSON, oversized bodies, invalid identifiers, unexpected object shapes, and unsupported fields before services query MongoDB.

No test in this repository validates a live provider, a real mission configuration, uncertainty propagation, environmental measurement, collision screening, or collision probability. Those would need reference datasets, source validation, and domain review before any corresponding capability could be claimed.
