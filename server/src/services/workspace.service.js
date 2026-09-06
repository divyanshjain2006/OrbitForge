import Workspace from "../models/workspace.model.js";
import Membership from "../models/membership.model.js";

export async function createWorkspaceForUser({ name, ownerId }) {
  const workspace = await Workspace.create({ name, ownerId });
  await Membership.create({ userId: ownerId, workspaceId: workspace._id, role: "OWNER" });
  return workspace;
}

export function listWorkspacesForUser(userId) {
  return Membership.find({ userId }).populate("workspaceId").sort({ createdAt: -1 }).lean();
}

export function findMembership(userId, workspaceId) {
  return Membership.findOne({ userId, workspaceId }).lean();
}

export function addMembership({ userId, workspaceId, role }) {
  return Membership.create({ userId, workspaceId, role });
}

export function listMemberships(workspaceId) {
  return Membership.find({ workspaceId }).populate("userId", "email displayName").sort({ createdAt: 1 }).lean();
}
