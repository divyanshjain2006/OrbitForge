import test from "node:test";
import assert from "node:assert/strict";
import { parseResearchQuery } from "../src/services/researchWorkspace.service.js";

test("research search query is bounded and accepts supported deterministic filters", () => {
  const cursor = Buffer.from(JSON.stringify({ createdAt: "2026-01-01T00:00:00.000Z", id: "abc" })).toString("base64url");
  const parsed = parseResearchQuery({ q: " Scout ", type: "EXPERIMENT", status: "ACTIVE", projectId: "p", limit: "10", cursor });
  assert.equal(parsed.q, "Scout"); assert.equal(parsed.limit, 10); assert.equal(parsed.cursor.id, "abc");
  assert.throws(() => parseResearchQuery({ type: "UNKNOWN" }), { code: "INVALID_RESEARCH_FILTER" });
  assert.throws(() => parseResearchQuery({ limit: "51" }), { code: "INVALID_RESEARCH_FILTER" });
  assert.throws(() => parseResearchQuery({ cursor: "bad" }), { code: "INVALID_CURSOR" });
});
