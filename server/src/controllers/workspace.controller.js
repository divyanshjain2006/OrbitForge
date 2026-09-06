import mongoose from "mongoose";
import User from "../models/user.model.js";
import { addMembership, createWorkspaceForUser, listMemberships, listWorkspacesForUser } from "../services/workspace.service.js";
import { recordAuditEvent } from "../services/audit.service.js";

function fail(res, status, code, message) { return res.status(status).json({ success: false, error: { code, message } }); }

export async function createWorkspace(req, res) {
  try {
    const workspace = await createWorkspaceForUser({ name: req.body.name, ownerId: req.auth.userId });
    void recordAuditEvent({ action: "WORKSPACE_CREATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: workspace._id, requestId: req.requestId });
    return res.status(201).json({ success: true, workspace });
  } catch (error) { return fail(res, 400, "WORKSPACE_CREATE_FAILED", "Unable to create workspace."); }
}

export async function listWorkspaces(req, res) {
  const memberships = await listWorkspacesForUser(req.auth.userId);
  return res.json({ success: true, workspaces: memberships.map(({ workspaceId, role }) => ({ ...workspaceId, role })) });
}

export async function createMembership(req, res) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.body.userId)) return fail(res, 400, "INVALID_USER_ID", "Invalid user ID.");
    if (req.body.role === "OWNER") return fail(res, 400, "INVALID_ROLE", "OWNER membership cannot be assigned through this endpoint.");
    const user = await User.findById(req.body.userId).lean();
    if (!user) return fail(res, 404, "RESOURCE_NOT_FOUND", "User not found.");
    const membership = await addMembership({ ...req.body, workspaceId: req.workspaceId });
    void recordAuditEvent({ action: "MEMBERSHIP_CREATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId, resourceType: "Membership", resourceId: String(membership._id), requestId: req.requestId });
    return res.status(201).json({ success: true, membership });
  } catch (error) {
    if (error?.code === 11000) return fail(res, 409, "MEMBERSHIP_EXISTS", "User is already a workspace member.");
    return fail(res, 400, "MEMBERSHIP_CREATE_FAILED", "Unable to add workspace member.");
  }
}

export async function getMemberships(req, res) { return res.json({ success: true, memberships: await listMemberships(req.workspaceId) }); }
