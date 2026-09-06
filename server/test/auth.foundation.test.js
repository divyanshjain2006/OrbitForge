import test from "node:test";
import assert from "node:assert/strict";
import { issueToken, publicUser, verifyToken } from "../src/services/auth.service.js";
import { hasWorkspaceRole } from "../src/middleware/auth.js";
import { requireAuthentication, requireWorkspaceRole } from "../src/middleware/auth.js";
import { validateAuthBody } from "../src/middleware/validation.js";
import Membership from "../src/models/membership.model.js";

process.env.JWT_SECRET = "test-only-secret-that-is-longer-than-thirty-two-characters";

function runValidation(middleware, body) {
  const req = { body };
  let result;
  const res = { status(code) { result = { code }; return this; }, json(value) { result.body = value; return this; } };
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { req, result, nextCalled };
}

test("signed authentication tokens identify the subject and reject tampering", () => {
  const token = issueToken({ _id: "507f1f77bcf86cd799439011", email: "researcher@example.test" });
  assert.equal(verifyToken(token).sub, "507f1f77bcf86cd799439011");
  assert.throws(() => verifyToken(`${token}x`));
});

test("authentication validation rejects short credentials and accepts valid registration input", () => {
  const invalid = runValidation(validateAuthBody({ registration: true }), { email: "bad", password: "short", displayName: "" });
  assert.equal(invalid.nextCalled, false);
  assert.equal(invalid.result.body.error.code, "INVALID_AUTH_INPUT");
  const valid = runValidation(validateAuthBody({ registration: true }), { email: " Researcher@Example.test ", password: "long-enough-password", displayName: " Researcher " });
  assert.equal(valid.nextCalled, true);
  assert.deepEqual(valid.req.body, { email: "researcher@example.test", password: "long-enough-password", displayName: "Researcher" });
});

test("public user payload never exposes a password hash", () => {
  const output = publicUser({ _id: "507f1f77bcf86cd799439011", email: "r@example.test", displayName: "R", passwordHash: "secret" });
  assert.equal(Object.hasOwn(output, "passwordHash"), false);
});

test("workspace role rules distinguish writers from viewers and administrators", () => {
  assert.equal(hasWorkspaceRole({ role: "OWNER" }, ["OWNER", "ADMIN"]), true);
  assert.equal(hasWorkspaceRole({ role: "ADMIN" }, ["OWNER", "ADMIN"]), true);
  assert.equal(hasWorkspaceRole({ role: "RESEARCHER" }, ["OWNER", "ADMIN"]), false);
  assert.equal(hasWorkspaceRole({ role: "VIEWER" }, ["OWNER", "ADMIN", "RESEARCHER"]), false);
  assert.equal(hasWorkspaceRole(null, ["VIEWER"]), false);
});

test("protected routes reject missing authentication before accessing data", async () => {
  const req = { get: () => "" };
  let response;
  const res = { status(code) { response = { code }; return this; }, json(body) { response.body = body; return this; } };
  await requireAuthentication(req, res, () => assert.fail("next must not be called"));
  assert.equal(response.code, 401);
  assert.equal(response.body.error.code, "AUTHENTICATION_REQUIRED");
});

test("workspace membership middleware rejects cross-workspace and viewer writes", async () => {
  const originalFindOne = Membership.findOne;
  const middleware = requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]);
  async function execute(membership) {
    Membership.findOne = () => ({ lean: async () => membership });
    const req = { params: { workspaceId: "507f1f77bcf86cd799439011" }, auth: { userId: "507f1f77bcf86cd799439012" }, requestId: "test" };
    let result;
    const res = { status(code) { result = { code }; return this; }, json(body) { result.body = body; return this; } };
    let allowed = false;
    await middleware(req, res, () => { allowed = true; });
    return { allowed, result };
  }
  try {
    const foreign = await execute(null);
    assert.equal(foreign.allowed, false);
    assert.equal(foreign.result.body.error.code, "WORKSPACE_ACCESS_DENIED");
    const viewer = await execute({ role: "VIEWER" });
    assert.equal(viewer.allowed, false);
    const researcher = await execute({ role: "RESEARCHER" });
    assert.equal(researcher.allowed, true);
  } finally {
    Membership.findOne = originalFindOne;
  }
});
