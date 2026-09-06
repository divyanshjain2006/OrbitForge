import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  outcome: { type: String, enum: ["SUCCESS", "DENIED", "FAILURE"], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null, index: true },
  resourceType: { type: String, default: null },
  resourceId: { type: String, default: null },
  requestId: { type: String, default: null },
  detail: { type: String, default: "", maxlength: 500 }
}, { timestamps: true });

export default mongoose.model("AuditEvent", auditEventSchema);
