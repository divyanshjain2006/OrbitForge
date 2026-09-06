# Prototype threat model

## Boundary

OrbitGuard is intended for a local or controlled demo environment. Browser input, route/query values, and database identifiers are untrusted. MongoDB and the API are trusted deployment components only when the operator has separately secured network access and credentials.

## Implemented mitigations

- Server routes validate MongoDB IDs before querying, reducing cast-error and identifier abuse paths.
- Mission and scenario payloads are allowlisted, must be JSON objects, and enforce finite bounded numeric inputs. `NaN`, `Infinity`, arrays, unknown fields, and out-of-domain orbital values are rejected.
- Decision payloads are allowlisted; the API ignores client-originated analytical snapshots and recomputes or loads the persisted authoritative snapshot.
- JSON bodies are limited to 32 KiB. A local in-memory per-IP limiter applies 300 API requests per 15-minute window.
- API responses use basic anti-sniffing, frame, referrer, and same-site resource headers. CORS is restricted to configurable local origins; `CORS_ORIGINS` must be set explicitly for another deployment.
- Error responses avoid stack traces and request IDs are returned for local correlation. Secrets are loaded only from environment configuration and are not logged by application code.

## Residual risks and required production work

There is no authentication, authorization, CSRF strategy for cookie-based deployments, persistent/distributed rate limiting, audit signing, encryption policy, secret rotation, database backup policy, monitoring, dependency scanning in CI, or multi-tenant isolation. The in-memory limiter does not coordinate across processes and is suitable only as a prototype guard. Do not expose this API publicly or treat its records as tamper-evident without those controls and a deployment-specific security review.
