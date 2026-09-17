import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
      index: true
    },
    simulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Simulation",
      index: true
    },
    challengeType: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "ACTIVE", "DECISION_REQUIRED", "COMPLETED", "FAILED", "ABANDONED"],
      default: "NOT_STARTED",
      required: true
    },
    currentStage: {
      type: Number,
      default: 0
    },
    performanceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    playerDecisionHistory: [
      {
        stage: Number,
        decision: {
          type: { type: String },
          description: String,
          parameters: mongoose.Schema.Types.Mixed
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    provenance: {
      startedAt: {
        type: Date
      },
      completedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Challenge", challengeSchema);
