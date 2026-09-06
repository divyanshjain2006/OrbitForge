import mongoose from "mongoose";

const researchRecordSchema = new mongoose.Schema({
  artifactType: { type: String, enum: ["MISSION_ANALYSIS", "EXPERIMENT_RUN"], default: "MISSION_ANALYSIS", immutable: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", default: null, index: true, immutable: true },
  analysisRunId: { type: mongoose.Schema.Types.ObjectId, ref: "AnalysisRun", default: undefined, unique: true, sparse: true, immutable: true },
  experimentRunId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperimentRun", default: undefined, unique: true, sparse: true, immutable: true },
  recordVersion: { type: String, required: true, immutable: true },
  semanticPayload: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  canonicalizationVersion: { type: String, required: true, immutable: true },
  integrityManifestId: { type: mongoose.Schema.Types.ObjectId, ref: "IntegrityManifest", required: true, immutable: true },
  provenance: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true }
}, { timestamps: true });

researchRecordSchema.pre("save", function preventMutation() {
  if (!this.isNew && this.isModified()) {
    throw new Error("Research records are immutable.");
  }
});

export default mongoose.model("ResearchRecord", researchRecordSchema);
