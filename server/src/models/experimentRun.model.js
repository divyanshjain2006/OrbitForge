import mongoose from "mongoose";
const experimentRunSchema = new mongoose.Schema({
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "Experiment", required: true, index: true, immutable: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true, immutable: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true, immutable: true },
  status: { type: String, enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"], required: true, immutable: true },
  startedAt: { type: Date, required: true, immutable: true }, completedAt: { type: Date, default: null, immutable: true },
  datasetVersionIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "DatasetVersion" }], required: true, immutable: true },
  parameters: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", default: null, immutable: true },
  method: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  results: { type: mongoose.Schema.Types.Mixed, default: null, immutable: true },
  provenance: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  researchRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchRecord", default: null, immutable: true },
  reproducedFromRunId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperimentRun", default: null, immutable: true },
  reproduction: { type: mongoose.Schema.Types.Mixed, default: null, immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true });
experimentRunSchema.index({ experimentId: 1, createdAt: -1 });
experimentRunSchema.pre("save", function immutableCompleted() { if (!this.isNew && this.isModified()) throw new Error("Experiment runs are immutable."); });
export default mongoose.model("ExperimentRun", experimentRunSchema);
