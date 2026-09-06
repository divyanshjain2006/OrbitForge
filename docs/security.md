# Security boundary

OrbitGuard is a security-hardened prototype, not an exposed operational service. The API applies allowlisted server-side payload validation, ObjectId validation, a 32 KiB JSON limit, basic response security headers, configurable allowlist CORS, request IDs, and a local in-memory rate limiter. Decision snapshots remain server-authoritative: analytical values supplied by a browser are not accepted.

It does not implement authentication, authorization, identity, signatures, tamper-evident records, durable/distributed rate limiting, secrets rotation, database encryption policy, or deployment monitoring. Before exposure beyond a controlled demo, secure MongoDB/network access, set explicit allowed origins, add identity and role checks, use a shared rate limiter, establish audit/retention/backup controls, scan dependencies, and complete a deployment-specific threat review. See [threat-model.md](threat-model.md) for concrete boundaries.
