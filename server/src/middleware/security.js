import crypto from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 300;
const clients = new Map();

export function securityHeaders(req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-site",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  });
  next();
}

export function requestContext(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.set("X-Request-Id", req.requestId);
  next();
}

export function localRateLimit(req, res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = clients.get(key);
  const entry = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 1 }
    : { ...current, count: current.count + 1 };
  clients.set(key, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ success: false, message: "Too many requests; try again later." });
  }
  return next();
}

const authClients = new Map();
export function authRateLimit(req, res, next) {
  const key = "auth:" + (req.ip || "unknown");
  const now = Date.now();
  const current = authClients.get(key);
  const entry = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 1 }
    : { ...current, count: current.count + 1 };
  authClients.set(key, entry);

  if (entry.count > 10) { // 10 attempts per 15 min
    return res.status(429).json({ success: false, message: "Too many authentication attempts; try again later." });
  }
  return next();
}

const aiClients = new Map();
export function aiRateLimit(req, res, next) {
  const key = "ai:" + (req.auth?.userId || req.ip || "unknown");
  const now = Date.now();
  const current = aiClients.get(key);
  const entry = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 1 }
    : { ...current, count: current.count + 1 };
  aiClients.set(key, entry);

  if (entry.count > 20) { // 20 AI calls per 15 min per user
    return res.status(429).json({ success: false, message: "AI rate limit exceeded; try again later." });
  }
  return next();
}
