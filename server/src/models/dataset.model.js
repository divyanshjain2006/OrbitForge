import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true, immutable: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, default: "", maxlength: 2000 },
  source: { type: String, enum: ["CNEOS_SCOUT"], required: true, immutable: true },
  sourceType: { type: String, enum: ["NASA_API"], required: true, immutable: true },
  sourceUri: { type: String, required: true, immutable: true },
  datasetType: { type: String, enum: ["NEO_HAZARD_ASSESSMENT"], required: true, immutable: true },
  status: { type: String, enum: ["ACTIVE", "DISABLED"], default: "ACTIVE" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true });

export default mongoose.model("Dataset", datasetSchema);
