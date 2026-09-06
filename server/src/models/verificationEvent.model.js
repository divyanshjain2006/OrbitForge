import mongoose from "mongoose";

const verificationEventSchema = new mongoose.Schema({
  researchRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchRecord", required: true, index: true, immutable: true },
  verifiedAt: { type: Date, required: true, immutable: true },
  result: { type: String, enum: ["VERIFIED", "FAILED"], required: true, immutable: true },
  expectedHash: { type: String, required: true, match: /^sha256:[a-f0-9]{64}$/, immutable: true },
  computedHash: { type: String, required: true, match: /^sha256:[a-f0-9]{64}$/, immutable: true },
  canonicalizationVersion: { type: String, required: true, immutable: true },
  algorithm: { type: String, enum: ["SHA-256"], required: true, immutable: true },
  verifier: { type: String, required: true, immutable: true }
}, { timestamps: true });

verificationEventSchema.pre("save", function appendOnly() {
  if (!this.isNew) {
    throw new Error("Verification events are append-only.");
  }
});

export default mongoose.model("VerificationEvent", verificationEventSchema);
