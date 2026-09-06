import test from "node:test";
import assert from "node:assert/strict";
import { assertFiniteJson, canonicalizePayload, sha256Digest } from "../src/services/integrity.service.js";

test("JCS canonicalization is stable across object key order, including nested objects", () => {
  const first = { z: [3, { beta: "two", alpha: "one" }], a: { y: true, x: null } };
  const second = { a: { x: null, y: true }, z: [3, { alpha: "one", beta: "two" }] };
  assert.equal(canonicalizePayload(first), canonicalizePayload(second));
  assert.equal(canonicalizePayload(first), '{"a":{"x":null,"y":true},"z":[3,{"alpha":"one","beta":"two"}]}');
});

test("JCS canonicalization correctly preserves JSON string escaping", () => {
  const canonical = canonicalizePayload({ quote: '"', newline: "\n", unicode: "é" });
  assert.equal(canonical, '{"newline":"\\n","quote":"\\\"","unicode":"é"}');
});

test("non-finite analytical values are rejected before canonicalization", () => {
  assert.throws(() => assertFiniteJson({ score: Number.NaN }), /non-finite/);
  assert.throws(() => canonicalizePayload({ score: Infinity }), /non-finite/);
});

test("SHA-256 uses the canonical payload and has the required digest format", () => {
  assert.equal(sha256Digest({}), "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a");
  const digest = sha256Digest({ b: 2, a: 1 });
  assert.equal(digest, sha256Digest({ a: 1, b: 2 }));
  assert.match(digest, /^sha256:[a-f0-9]{64}$/);
});
