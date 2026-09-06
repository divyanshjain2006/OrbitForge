import Mission from "../models/mission.model.js";

import {
  analyzeMissionScenario
} from "../services/scenario.service.js";

import {
  createAssessment
} from "../services/assessment.service.js";

export async function analyzeScenario(
  req,
  res
) {
  try {
    const { missionId } = req.params;

    const mission =
      await Mission.findById(missionId).lean();

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    /*
     * ------------------------------------------
     * RUN SCENARIO ANALYSIS
     * ------------------------------------------
     */

    const result =
      analyzeMissionScenario({
        currentMission: mission,
        scenario: req.body
      });

    const scenarioConfiguration =
      result.scenario.configuration;

    const environment =
      result.scenario.environment;

    /*
     * ------------------------------------------
     * SAVE SCENARIO TO HISTORY
     * ------------------------------------------
     */

    const scenarioAssessment =
      await createAssessment({
          missionId: mission._id,

          type: "SCENARIO_SIMULATION",

          risk: {
            score: result.scenario.risk.score,
            level: result.scenario.risk.level
          },

          configuration: {
            altitude:
              scenarioConfiguration.altitude,

            inclination:
              scenarioConfiguration.inclination,

            duration:
              scenarioConfiguration.duration
          },

          environment: {
            score: environment.score,
            level: environment.level
          },

          summary:
            result.comparison.explanation,

          decision:
            result.comparison.direction
        });

    const scenarioAssessmentId =
      scenarioAssessment?._id || null;

    if (!scenarioAssessmentId) {
      throw new Error(
        "Scenario assessment could not be persisted."
      );
    }

    /*
     * ------------------------------------------
     * RESPONSE
     * ------------------------------------------
     */

    return res.json({
      success: true,

      mission: {
        id: mission._id,
        name: mission.name
      },

      result,

      assessmentId:
        scenarioAssessmentId
    });
  } catch (error) {
    console.error(
      "Scenario analysis failed:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to analyze mission scenario"
    });
  }
}