import AuditEvent from "../models/auditEvent.model.js";

// Audit writes must not turn an otherwise valid security response into a 500.
export function recordAuditEvent(event) {
  if (AuditEvent.db.readyState !== 1) return Promise.resolve();
  return AuditEvent.create(event).catch((error) => console.error("Audit event write failed:", error.message));
}
