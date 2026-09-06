import mongoose from "mongoose";

const integrityManifestSchema = new mongoose.Schema({
  researchRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchRecord", required: true, unique: true, immutable: true },
  algorithm: { type: String, enum: ["SHA-256"], required: true, immutable: true },
  canonicalizationVersion: { type: String, required: true, immutable: true },
  digest: { type: String, required: true, match: /^sha256:[a-f0-9]{64}$/, immutable: true },
  createdBy: { type: String, required: true, immutable: true }
}, { timestamps: true });

integrityManifestSchema.pre("save", function preventMutation() {
  if (!this.isNew && this.isModified()) {
    throw new Error("Integrity manifests are immutable.");
  }
});

export default mongoose.model("IntegrityManifest", integrityManifestSchema);
