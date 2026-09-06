# Validation

## Automated coverage in the repository

Server Node tests cover mission-service behavior, scenario behavior, decision mapping, server-authoritative snapshots, scenario lifecycle guards, model domain rejection, and the documented circular-orbit algebraic reference case. Client lint checks ESLint rules; build runs Vite’s production compilation. See [validation.md](validation.md) for acceptance boundaries.

## Validation boundaries

Automated tests do not validate scientific fidelity, MongoDB deployment, authentication, live external data, browser behavior, or an operational mission workflow. A manual demo should create a mission, inspect analysis, run/select a scenario, record a reasoned decision, apply an approved scenario, and verify reassessment/history.

Use `npm run lint`, `npm run build`, and `npm test` when Node/npm and MongoDB-independent test dependencies are available. Results from the final pass are recorded in the task report, not asserted here as permanent repository state.
