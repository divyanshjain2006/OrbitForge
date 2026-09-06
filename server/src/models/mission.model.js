import mongoose from "mongoose";

const missionDecisionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "PENDING_REVIEW",
        "APPROVED",
        "SCENARIO_APPROVED",
        "HOLD",
        "REJECTED"
      ],
      default: "PENDING_REVIEW"
    },

    label: {
      type: String,
      default: "Pending review"
    },

    reason: {
      type: String,
      default: ""
    },

    decidedAt: {
      type: Date,
      default: null
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
    _id: false
  }
);

const missionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },

    altitude: {
      type: Number,
      required: true,
      min: 100,
      max: 2000
    },

    inclination: {
      type: Number,
      required: true,
      min: 0,
      max: 180
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 3650
    },

    decision: {
      type: missionDecisionSchema,
      default: () => ({
        status: "PENDING_REVIEW",
        label: "Pending review"
      })
    }
  },
  {
    timestamps: true
  }
);

const Mission = mongoose.model(
  "Mission",
  missionSchema
);

export default Mission;
