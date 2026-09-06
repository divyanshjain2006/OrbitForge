import mongoose from "mongoose";
const projectSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true, immutable: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, default: "", maxlength: 3000 },
  status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true });
projectSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });
export default mongoose.model("Project", projectSchema);
