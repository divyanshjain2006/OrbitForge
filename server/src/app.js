import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import environmentRoutes from "./routes/environment.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import riskRoutes from "./routes/risk.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import intelligenceRoutes from "./routes/intelligence.routes.js";
import scenarioRoutes from "./routes/scenario.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import decisionRoutes from "./routes/decision.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import trustRoutes from "./routes/trust.routes.js";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import projectExperimentRoutes from "./routes/projectExperiment.routes.js";
import researchWorkspaceRoutes from "./routes/researchWorkspace.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { localRateLimit, requestContext, securityHeaders } from "./middleware/security.js";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

// Load configuration before this module reads CORS_ORIGINS. This also makes
// importing the app (for tests or scripts) behave the same as starting it.
dotenv.config({ path: resolve(sourceDirectory, "../.env") });

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173,https://localhost:5173,https://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Vite forwards the browser's original Origin header to the local API. In a
// GitHub Codespace that origin is the HTTPS port-preview URL, rather than
// localhost. Permit only the Codespaces preview host format; all other remote
// origins must still be explicitly configured through CORS_ORIGINS.
function isCodespacesPreviewOrigin(origin) {
  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".app.github.dev") ||
        url.hostname.endsWith(".githubpreview.dev"))
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  return (
    allowedOrigins.includes(origin) ||
    isCodespacesPreviewOrigin(origin)
  );
}

app.disable("x-powered-by");
app.use(requestContext);
app.use(securityHeaders);

app.use((req, res, next) => {
  const originalOrigin = req.headers.origin;
  const forwardedHost = req.headers["x-forwarded-host"];
  const forwardedProto = req.headers["x-forwarded-proto"];

  if (
    forwardedProto === "https" &&
    typeof forwardedHost === "string" &&
    isCodespacesPreviewOrigin(`https://${forwardedHost}`) &&
    originalOrigin === "https://localhost:5173"
  ) {
    req.headers.origin = `https://${forwardedHost}`;
  }

  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use("/api", localRateLimit);
app.use(express.json({ limit: "32kb", strict: true }));

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "OrbitGuard backend is healthy"
  });
});

/* =========================================================
   V1 API ROUTES — All authenticated & workspace-scoped
   ========================================================= */

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", trustRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1", datasetRoutes);
app.use("/api/v1", projectExperimentRoutes);
app.use("/api/v1", researchWorkspaceRoutes);
app.use("/api/v1", missionRoutes);
app.use("/api/v1", decisionRoutes);
app.use("/api/v1/challenges", challengeRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1", simulationRoutes);
app.use("/api/v1", analysisRoutes);
app.use("/api/v1", intelligenceRoutes);
app.use("/api/v1", scenarioRoutes);
app.use("/api/v1", riskRoutes);
app.use("/api/v1", assessmentRoutes);
app.use("/api/v1", environmentRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON request body." });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }
  if (error?.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ success: false, message: "Origin is not allowed." });
  }
  console.error("Unhandled request error", {
    requestId: req.requestId,
    message: error?.message,
    name: error?.name,
    stack: error?.stack
  });
  return res.status(500).json({ success: false, message: "Unexpected server error." });
});

export default app;
