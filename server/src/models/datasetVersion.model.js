import mongoose from "mongoose";

const datasetVersionSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: true, index: true, immutable: true },
  version: { type: Number, required: true, min: 1, immutable: true },
  sourceUri: { type: String, required: true, immutable: true },
  retrievedAt: { type: Date, required: true, immutable: true },
  rawPayload: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  rawPayloadHash: { type: String, required: true, match: /^sha256:[a-f0-9]{64}$/, immutable: true },
  normalizedPayload: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  normalizedPayloadHash: { type: String, required: true, match: /^sha256:[a-f0-9]{64}$/, immutable: true },
  canonicalizationVersion: { type: String, required: true, immutable: true },
  validationStatus: { type: String, enum: ["PENDING", "VALID", "VALID_WITH_WARNINGS", "INVALID"], default: "PENDING" },
  provenance: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  ingestionVersion: { type: String, required: true, immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true });

datasetVersionSchema.index({ datasetId: 1, version: 1 }, { unique: true });
datasetVersionSchema.pre("save", function preventMutation() {
  if (!this.isNew && this.isModified() && this.modifiedPaths().some((path) => path !== "validationStatus" && path !== "updatedAt")) {
    throw new Error("Dataset versions are immutable except validation status.");
  }
});

export default mongoose.model("DatasetVersion", datasetVersionSchema);
