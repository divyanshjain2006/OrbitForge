import mongoose from "mongoose";

const analysisRunSchema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
  runId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["COMPLETED", "FAILED"], required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  inputs: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  outputs: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  modelVersions: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  provenance: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  researchRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchRecord", default: null }
}, { timestamps: true });

export default mongoose.model("AnalysisRun", analysisRunSchema);
