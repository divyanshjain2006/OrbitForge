import crypto from "node:crypto";
import canonicalize from "canonicalize";

export const CANONICALIZATION_VERSION = "RFC8785-JCS";
export const HASH_ALGORITHM = "SHA-256";

export function assertFiniteJson(value, path = "payload") {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`${path} contains a non-finite number.`);
  }
  if (Array.isArray(value)) value.forEach((item, index) => assertFiniteJson(item, `${path}[${index}]`));
  else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => assertFiniteJson(item, `${path}.${key}`));
  }
}

export function canonicalizePayload(payload) {
  assertFiniteJson(payload);
  const result = canonicalize(payload);
  if (typeof result !== "string") throw new Error("Payload cannot be canonicalized as JSON.");
  return result;
}

export function sha256Digest(payload) {
  const canonicalJson = canonicalizePayload(payload);
  const hex = crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
  return `sha256:${hex}`;
}
