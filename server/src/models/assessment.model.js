import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "INITIAL_ASSESSMENT",
        "SCENARIO_SIMULATION",
        "RISK_REASSESSMENT"
      ],
      required: true
    },

    risk: {
      score: {
        type: Number,
        required: true
      },
      level: {
        type: String,
        required: true
      }
    },

    configuration: {
      altitude: Number,
      inclination: Number,
      duration: Number
    },

    environment: {
      score: Number,
      level: String
    },

    summary: {
      type: String,
      default: "",
      maxlength: 4000
    },

    decision: {
      type: String,
      default: "",
      maxlength: 200
    },

    reproducibility: {
      runId: { type: String, required: true, index: true },
      evaluatedAt: { type: Date, required: true },
      models: {
        orbital: String,
        risk: String,
        environment: String
      },
      provenance: {
        type: String,
        enum: ["MODELED", "SIMULATED"],
        required: true
      }
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index(
  { missionId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "INITIAL_ASSESSMENT"
    }
  }
);

export default mongoose.model(
  "Assessment",
  assessmentSchema
);
