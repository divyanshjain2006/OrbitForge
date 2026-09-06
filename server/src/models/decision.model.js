import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
      index: true
    },

    decision: {
      type: String,
      enum: ["APPROVE", "REVIEW", "REJECT"],
      required: true
    },

    configuration: {
      altitude: {
        type: Number,
        required: true
      },
      inclination: {
        type: Number,
        required: true
      },
      duration: {
        type: Number,
        required: true
      }
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

    environment: {
      score: {
        type: Number,
        required: true
      },
      level: {
        type: String,
        required: true
      }
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    source: {
      type: String,
      enum: [
        "CURRENT_CONFIGURATION",
        "SCENARIO_SIMULATION"
      ],
      default: "CURRENT_CONFIGURATION"
    },

    scenarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Decision = mongoose.model(
  "Decision",
  decisionSchema
);

export default Decision;
