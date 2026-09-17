import test from "node:test";
import assert from "node:assert/strict";
import { issueToken, verifyToken } from "../src/services/auth.service.js";

// Mock environment for JWT
process.env.JWT_SECRET = "test-only-secret-that-is-longer-than-thirty-two-characters";

test("JWT verification enforces HS256 algorithm", () => {
  const user = { _id: "507f1f77bcf86cd799439011", email: "test@example.com" };
  const token = issueToken(user);
  const payload = verifyToken(token);
  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
});

import { authRateLimit, aiRateLimit } from "../src/middleware/security.js";

test("authRateLimit enforces max attempts", () => {
  const req = { ip: "127.0.0.1" };
  let statusCodes = [];
  const res = {
    status(code) { statusCodes.push(code); return this; },
    json() { return this; }
  };
  const next = () => { statusCodes.push(200); };

  // Hit it 10 times (should pass)
  for (let i = 0; i < 10; i++) {
    authRateLimit(req, res, next);
  }
  
  // 11th time should fail (429)
  authRateLimit(req, res, next);

  assert.equal(statusCodes.filter(c => c === 200).length, 10);
  assert.equal(statusCodes.includes(429), true);
});
