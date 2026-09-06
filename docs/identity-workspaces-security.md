# Milestone 1B: Identity, Workspaces, and Security

The protected API uses local email/password accounts. Passwords are hashed with `bcryptjs` using 12 rounds and the plaintext password is neither stored nor returned. Successful login and registration return a signed JWT (`Authorization: Bearer <token>`), issued with the `orbitforge` issuer/audience and an eight-hour expiry. `JWT_SECRET` is mandatory and must be at least 32 characters. CORS explicitly permits the `Authorization` request header for approved browser origins.

Each registration creates a personal Workspace and an OWNER Membership. Membership roles are OWNER, ADMIN, RESEARCHER, and VIEWER. OWNER and ADMIN can manage memberships and delete missions; OWNER, ADMIN, and RESEARCHER can create missions and execute analysis/verification; all roles can read workspace missions and trust artifacts.

New workspace-isolated resources use `/api/v1`:

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET|POST /api/v1/workspaces`
- `GET|POST /api/v1/workspaces/:workspaceId/members`
- `GET|POST /api/v1/workspaces/:workspaceId/missions`
- `GET|DELETE /api/v1/workspaces/:workspaceId/missions/:id`

The existing trust endpoints now require a bearer token and resolve the AnalysisRun or ResearchRecord back to its Mission before checking workspace membership. Workspace IDs from clients are never enough on their own to grant access. Audit events record registration/login, denied workspace checks, membership changes, mission creation/deletion, analysis execution, and verification.

Required server environment values are `MONGODB_URI` and `JWT_SECRET`; optional values are `PORT` and `CORS_ORIGINS`. The credential-bearing MongoDB example was replaced with a non-secret local URI placeholder.

Legacy `/api/*` endpoints are preserved for the existing single-user frontend. They remain a compatibility/migration surface and do not supply workspace isolation for pre-workspace records. New multi-user work must use `/api/v1`; a migration and eventual legacy-route retirement are required before a public deployment.

Deferred: password reset/email verification, refresh-token rotation/revocation, OAuth/MFA, rate limiting backed by shared storage, database transactions for registration/workspace provisioning, migration of legacy unscoped missions, production audit retention, and a frontend sign-in/workspace selector.
