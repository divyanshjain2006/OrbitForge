# OrbitForge Space Weather & Mission Lab

OrbitForge is an interactive space-mission laboratory where users explore real NASA data, design missions, run scientific experiments, simulate mission operations, make decisions under uncertainty, and produce verifiable, reproducible research.

## What is OrbitForge?
OrbitForge bridges the gap between raw aerospace data and interactive mission simulation. It allows researchers, educators, and space enthusiasts to design Low Earth Orbit (LEO) missions and immediately see how real-world space weather events—like Coronal Mass Ejections (CMEs)—affect orbital risk and mission survival.

## Problem
Space weather data is often siloed, highly technical, and difficult to translate into operational impact for mission design. Furthermore, educational and simulation tools rarely provide verifiable, cryptographically secure research provenance that allows experiments to be cleanly reproduced.

## Solution
OrbitForge ingests real NASA CCMC DONKI data, runs it through a deterministic space weather and orbital risk model, and provides a "Simulation Lab" where users must make operational decisions. The results of these simulations and analyses are then cryptographically signed and stored as reproducible Research Records.

## Major features
- **Interactive Mission Design**: Create and configure LEO missions (Altitude, Inclination, Duration).
- **Space Weather Integration**: Ingests real NASA DONKI Coronal Mass Ejection (CME) data.
- **Simulation Lab**: Step through mission days, encounter space weather events, and make operational decisions (e.g., Adjust Orbit, Safe Mode).
- **Mission Challenges**: Gamified operational scenarios to test decision-making under uncertainty.
- **Cryptographic Trust**: Research outputs are hashed and stored with an Integrity Manifest to ensure provenance.
- **Reproducibility Engine**: Re-run identical models against pinned dataset versions to verify findings.
- **AI Integration**: AI Agents provide scientific explanation and scenario analysis (without fabricating data).
- **Workspace Isolation**: Multi-tenant RBAC (Role-Based Access Control) for collaborative teams.

## NASA data sources
- **NASA CCMC DONKI (Database Of Notifications, Knowledge, Information)**
  - Source for Coronal Mass Ejection (CME) data.
  - OrbitForge validates and versions this dataset for deterministic reproducibility.
  - *Note: OrbitForge uses the DONKI-API endpoint.*

## Scientific models
1. **Space Weather Model (v1.0.0)**: Translates CME half-angle and speed into an environmental hazard score based on orbital altitude and inclination.
2. **Orbital Risk Model (v2.0.0)**: Calculates baseline risk profiles using atmospheric drag assumptions and orbital density heuristics.
3. **Space Environment Model (v1.0.0)**: Combines solar activity with baseline radiation exposure.

## AI architecture
OrbitForge utilizes a provider-agnostic AI Gateway. AI is strictly downstream of the deterministic scientific models.
- **Scientific Explainer**: Translates hazard scores and orbital physics into human-readable rationale.
- **Scenario Analyst**: Analyzes operational decisions made during simulations.
- **Research Assistant**: Contextualizes dataset versions and methodology.
*AI is never used to generate fake scientific measurements.*

## Research/trust system
Every published analysis, simulation, or challenge creates a **Research Record**.
- The deterministic inputs, outputs, model versions, and dataset provenance are serialized.
- A SHA-256 hash digest is generated.
- An **Integrity Manifest** is created to permanently link the cryptographic signature.
- Users can "Verify" records at any time to ensure the database has not been tampered with.

## Reproducibility
OrbitForge tracks exactly which Dataset Version and Model Version produced a result. The Reproducibility Engine allows users to execute a re-run of a Research Record. If the resulting SHA-256 digest matches the original Integrity Manifest, the result is cryptographically verified as reproducible.

## Mission/Simulation/Challenge system
- **Mission Lab**: Static analysis of orbital parameters against baseline risk.
- **Simulation Lab**: Dynamic state machine where time advances and events occur. Users make choices that affect the final scientific output.
- **Challenge Debrief**: Evaluation of player performance versus scientific outcome.

## Technology stack
- **Frontend**: React, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Security**: JWT Authentication, Workspace Isolation Middleware
- **Integrity**: Node Crypto (SHA-256)

## Setup
1. `npm run install:all`
2. `cp server/.env.example server/.env`
3. Configure your `.env` (MongoDB URI, AI keys if using).
4. Run `npm run dev:server` and `npm run dev:client`.

## Environment variables
- `PORT`: API Port (default 3001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN`: Authentication config
- `AI_PROVIDER`: "google", "openai", "anthropic", or "mock"
- `DONKI_API_BASE_URL`: Base URL for NASA DONKI

## Testing
- **Backend**: `cd server && npm test`
- **Frontend**: `cd client && npm run lint && npm run build`

## Known scientific limitations
OrbitForge is a demonstrative application built for educational and conceptual exploration.
- **Orbital Mechanics**: OrbitForge uses simplified circular orbit approximations. It does not perform full Keplerian integration or J2 perturbation analysis.
- **Space Weather**: The Space Weather Model (v1.0.0) uses a highly simplified heuristic to map CME properties to LEO radiation/drag impacts. **It is not an official NASA hazard score.**
- **Conjunctions**: OrbitForge does not track real-world satellite catalogs (TLEs) or perform actual conjunction assessments (COLA).
- **Usage**: Do not use OrbitForge for real spacecraft operations, navigation, or safety-critical analysis.

## License
MIT
