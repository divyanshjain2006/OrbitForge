import mongoose from "mongoose";

const aiInteractionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, required: true, index: true },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  
  contextReferences: {
    datasetId: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", default: null },
    datasetVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "DatasetVersion", default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "Experiment", default: null },
    experimentRunId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperimentRun", default: null },
    researchRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchRecord", default: null },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", default: null }
  },

  answer: { type: String, default: null },
  reasoningSummary: { type: String, default: null },
  scientificCaveats: { type: String, default: null },
  
  status: { type: String, enum: ["SUCCESS", "FAILED", "TIMEOUT", "UNAUTHORIZED", "MALFORMED"], required: true },
  errorInformation: { type: String, default: null },
  
  latencyMs: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("AiInteraction", aiInteractionSchema);
