import mongoose from "mongoose";

export const WORKSPACE_ROLES = Object.freeze(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]);

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  role: { type: String, enum: WORKSPACE_ROLES, required: true }
}, { timestamps: true });

membershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
