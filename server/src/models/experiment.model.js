import mongoose from "mongoose";
const experimentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true, immutable: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true, immutable: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, default: "", maxlength: 3000 },
  objective: { type: String, default: "", maxlength: 2000 },
  hypothesis: { type: String, default: "", maxlength: 2000 },
  type: { type: String, enum: ["MISSION_RISK_ANALYSIS"], required: true, immutable: true },
  status: { type: String, enum: ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"], default: "DRAFT" },
  method: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true });
experimentSchema.index({ projectId: 1, status: 1, createdAt: -1 });
export default mongoose.model("Experiment", experimentSchema);
