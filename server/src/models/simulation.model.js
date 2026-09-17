import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    missionDay: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["INITIALIZATION", "EVENT", "DECISION"],
      required: true
    },
    event: {
      type: {
        type: String
      },
      description: String,
      parameters: mongoose.Schema.Types.Mixed
    },
    decision: {
      type: {
        type: String
      },
      description: String,
      parameters: mongoose.Schema.Types.Mixed
    },
    state: {
      configuration: {
        altitude: Number,
        inclination: Number,
        duration: Number
      },
      risk: {
        score: Number,
        level: String
      },
      environment: {
        score: Number,
        level: String
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const simulationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE",
      required: true
    },
    performanceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    currentMissionDay: {
      type: Number,
      default: 0
    },
    initialState: {
      configuration: {
        altitude: Number,
        inclination: Number,
        duration: Number
      },
      risk: {
        score: Number,
        level: String
      },
      environment: {
        score: Number,
        level: String
      }
    },
    currentState: {
      configuration: {
        altitude: Number,
        inclination: Number,
        duration: Number
      },
      risk: {
        score: Number,
        level: String
      },
      environment: {
        score: Number,
        level: String
      }
    },
    timeline: [timelineEntrySchema],
    provenance: {
      startedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Simulation", simulationSchema);
