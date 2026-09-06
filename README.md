# OrbitGuard

OrbitGuard is a full-stack mission-decision workspace for low-Earth-orbit (LEO) missions. It lets operators create missions, assess orbital and environmental risk, simulate alternative configurations, and record explainable approval decisions.

## What it does

- Create and manage LEO mission profiles
- Calculate explainable risk from altitude, inclination, duration, and interacting conditions
- Assess the space environment and mission intelligence signals
- Run and compare mission scenarios before committing changes
- Maintain an assessment and decision history for each mission

> The current risk and environment models are deterministic decision-support tools. They are not a substitute for operational flight dynamics, conjunction assessment, or regulatory review.

## Architecture

```text
client/  React + Vite dashboard
server/  Express + MongoDB API and decision services
docs/    Technical and scientific reference material
```

The client calls the API through Vite's `/api` development proxy. The server persists missions, assessments, and decisions in MongoDB.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A MongoDB database (local or hosted)

## Quick start

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create the server configuration:

   ```bash
   cp server/.env.example server/.env
   ```

3. Set `MONGODB_URI` in `server/.env`.

4. Start the API and client in separate terminals:

   ```bash
   npm run dev:server
   npm run dev:client
   ```

5. Open http://localhost:5173.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install client and server dependencies |
| `npm run dev:client` | Start the React dashboard |
| `npm run dev:server` | Start the Express API with reloads |
| `npm run build` | Create a production client build |
| `npm test` | Run server tests |
| `npm run lint` | Lint the client |

## API overview

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `/api/missions` | Create, list, retrieve, and delete missions |
| `GET /api/analysis/:missionId` | Produce orbital and risk analysis |
| `GET /api/intelligence/:missionId` | Produce mission-intelligence insights |
| `POST /api/scenario/:missionId` | Simulate an alternate configuration |
| `/api/assessments/:missionId` | Retrieve assessment history |
| `/api/decisions/:missionId` | Record and retrieve decision history |

See the route files under `server/src/routes` for request shapes and supported methods.

## Quality checks

Every pull request runs the client lint/build and server test suite through GitHub Actions. Run the same checks locally before opening a pull request:

```bash
npm run lint
npm run build
npm test
```

## Project status

OrbitGuard is an active prototype. Contributions that improve validation, model calibration, observability, accessibility, test coverage, or deployment readiness are especially welcome.

## Documentation

The documentation map is in [docs/README.md](docs/README.md). In particular, [scientific models](docs/scientific-models.md), [risk model](docs/risk-model.md), [decision logic](docs/decision-logic.md), and [assumptions and limitations](docs/assumptions-and-limitations.md) distinguish implemented prototype behavior from operational aerospace systems.

## License

[MIT](LICENSE)
