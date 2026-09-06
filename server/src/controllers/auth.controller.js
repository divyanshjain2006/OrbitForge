import { authenticateCredentials, issueToken, publicUser, registerUser } from "../services/auth.service.js";
import { createWorkspaceForUser } from "../services/workspace.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

function fail(res, status, code, message) { return res.status(status).json({ success: false, error: { code, message } }); }

export async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    const workspace = await createWorkspaceForUser({ name: `${user.displayName}'s workspace`, ownerId: user._id });
    void recordAuditEvent({ action: "AUTH_REGISTER", outcome: "SUCCESS", actorId: user._id, workspaceId: workspace._id, requestId: req.requestId });
    return res.status(201).json({ success: true, user: publicUser(user), workspace, token: issueToken(user) });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    console.error("Registration failed:", error.message);
    return fail(res, 400, "REGISTRATION_FAILED", "Unable to register user.");
  }
}

export async function login(req, res) {
  try {
    const user = await authenticateCredentials(req.body.email, req.body.password);
    if (!user) {
      void recordAuditEvent({ action: "AUTH_LOGIN", outcome: "DENIED", requestId: req.requestId, detail: "Invalid credentials." });
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }
    void recordAuditEvent({ action: "AUTH_LOGIN", outcome: "SUCCESS", actorId: user._id, requestId: req.requestId });
    return res.json({ success: true, user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    console.error("Login failed:", error.message);
    return fail(res, 500, "AUTHENTICATION_FAILED", "Unable to authenticate.");
  }
}

export function me(req, res) { return res.json({ success: true, user: publicUser(req.auth.user) }); }
