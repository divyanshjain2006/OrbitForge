import Assessment from "../models/assessment.model.js";
import crypto from "node:crypto";

const MODEL_VERSIONS = Object.freeze({
  orbital: "1.1.0",
  risk: "2.0.0",
  environment: "1.0.0"
});

export async function createAssessment(data) {
  const enriched = {
    ...data,
    reproducibility: {
      runId: crypto.randomUUID(),
      evaluatedAt: new Date(),
      models: MODEL_VERSIONS,
      provenance: data?.type === "SCENARIO_SIMULATION" ? "SIMULATED" : "MODELED"
    }
  };
  /*
   * INITIAL_ASSESSMENT must be unique per mission.
   *
   * Analysis can be requested repeatedly because of:
   * - page refreshes
   * - navigation
   * - multiple frontend components
   * - development reloads
   *
   * Never create duplicate baseline assessments.
   */
  if (
    enriched?.type === "INITIAL_ASSESSMENT" &&
    enriched?.missionId
  ) {
    const existingAssessment =
      await Assessment.findOne({
        missionId: enriched.missionId,
        type: "INITIAL_ASSESSMENT"
      });

    if (existingAssessment) {
      return existingAssessment;
    }
  }

  return Assessment.create(enriched);
}

export async function getMissionAssessmentHistory(
  missionId
) {
  return Assessment.find({
    missionId
  })
    .sort({ createdAt: -1 })
    .lean();
}
