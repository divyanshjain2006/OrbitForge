import mongoose from "mongoose";

const aiProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, required: true, lowercase: true, enum: ["openai", "gemini", "claude", "openrouter"] },
  encryptedKey: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  encryptionVersion: { type: Number, required: true, default: 1 },
  lastTestedAt: { type: Date }
}, { timestamps: true });

// A user should have at most one active credential record for each provider.
aiProviderSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.model("AiProvider", aiProviderSchema);
