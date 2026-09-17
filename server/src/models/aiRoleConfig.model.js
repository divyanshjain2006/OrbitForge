import mongoose from "mongoose";

const aiRoleConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true, uppercase: true },
  provider: { type: String, required: true, lowercase: true, enum: ["openai", "gemini", "claude", "openrouter"] },
  model: { type: String, required: true }
}, { timestamps: true });

// Each user should have one active configuration per AI role.
aiRoleConfigSchema.index({ userId: 1, role: 1 }, { unique: true });

export default mongoose.model("AiRoleConfig", aiRoleConfigSchema);
