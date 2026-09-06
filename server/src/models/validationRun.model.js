import mongoose from "mongoose";

const validationRunSchema = new mongoose.Schema({
  datasetVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "DatasetVersion", required: true, index: true, immutable: true },
  status: { type: String, enum: ["VALID", "VALID_WITH_WARNINGS", "INVALID"], required: true, immutable: true },
  checks: { type: [mongoose.Schema.Types.Mixed], required: true, immutable: true },
  errors: { type: [String], default: [], immutable: true },
  warnings: { type: [String], default: [], immutable: true },
  validatorVersion: { type: String, required: true, immutable: true },
  executedAt: { type: Date, required: true, immutable: true },
  summary: { type: String, required: true, maxlength: 1000, immutable: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }
}, { timestamps: true, suppressReservedKeysWarning: true });

validationRunSchema.pre("save", function appendOnly() { if (!this.isNew) throw new Error("Validation runs are append-only."); });
export default mongoose.model("ValidationRun", validationRunSchema);
