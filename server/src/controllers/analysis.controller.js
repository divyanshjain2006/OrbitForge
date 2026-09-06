import Mission from "../models/mission.model.js";

import {
  calculateOrbitalAnalysis
} from "../services/analysis/orbitalAnalysis.service.js";

import {
  calculateMissionRisk
} from "../services/risk.service.js";

import {
  assessSpaceEnvironment
} from "../services/spaceEnvironment/spaceEnvironment.service.js";

import {
  createAssessment,
  getMissionAssessmentHistory
} from "../services/assessment.service.js";

export async function getMissionAnalysis(
  req,
  res
) {
  try {
    const { missionId } = req.params;

    const mission =
      await Mission.findById(missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    /*
     * ------------------------------------------
     * ORBITAL ANALYSIS
     * ------------------------------------------
     */

    const analysis =
      calculateOrbitalAnalysis(mission);

    /*
     * ------------------------------------------
     * RISK ASSESSMENT
     * ------------------------------------------
     */

    const risk =
      calculateMissionRisk(mission);

    /*
     * ------------------------------------------
     * SPACE ENVIRONMENT
     * ------------------------------------------
     */

    const environment =
      assessSpaceEnvironment({
        altitude: mission.altitude,
        inclination: mission.inclination
      });

    /*
     * ------------------------------------------
     * DETERMINE ASSESSMENT TYPE
     * ------------------------------------------
     *
     * The first analysis for a mission is the
     * baseline assessment.
     *
     * Any later analysis is a reassessment.
     *
     * This prevents page refreshes from creating
     * fake duplicate baseline history.
     */

    const assessmentHistory =
      await getMissionAssessmentHistory(
        mission._id
      );

    const hasInitialAssessment =
      assessmentHistory.some(
        (assessment) =>
          assessment.type ===
          "INITIAL_ASSESSMENT"
      );

    const assessmentType =
      hasInitialAssessment
        ? "RISK_REASSESSMENT"
        : "INITIAL_ASSESSMENT";

    /*
     * ------------------------------------------
     * STORE ASSESSMENT HISTORY
     * ------------------------------------------
     */

    try {
      /*
       * Do not create repeated reassessment
       * records for the same configuration.
       *
       * This protects against:
       * - page refreshes
       * - React development reloads
       * - repeated API requests
       */

      const alreadyRecorded =
        assessmentHistory.some(
          (assessment) =>
            assessment.type ===
              assessmentType &&
            Number(
              assessment.configuration?.altitude
            ) === Number(mission.altitude) &&
            Number(
              assessment.configuration?.inclination
            ) === Number(mission.inclination) &&
            Number(
              assessment.configuration?.duration
            ) === Number(mission.duration)
        );

      if (!alreadyRecorded) {
        await createAssessment({
          missionId: mission._id,

          type: assessmentType,

          risk: {
            score: risk.score,
            level: risk.level
          },

          configuration: {
            altitude: Number(
              mission.altitude
            ),

            inclination: Number(
              mission.inclination
            ),

            duration: Number(
              mission.duration
            )
          },

          environment: {
            score: environment.score,
            level: environment.level
          },

          summary:
            assessmentType ===
            "INITIAL_ASSESSMENT"
              ? `Mission assessed with ${risk.level.toLowerCase()} risk and ${environment.level.toLowerCase()} environmental exposure.`
              : `Mission reassessed with ${risk.level.toLowerCase()} risk and ${environment.level.toLowerCase()} environmental exposure after configuration change.`,

          decision:
            risk.operationalPosture?.label ||
            "Mission reassessment"
        });
      }
    } catch (historyError) {
      /*
       * History storage must never break
       * the primary analysis endpoint.
       */

      console.error(
        "Assessment history storage failed:",
        historyError
      );
    }

    /*
     * ------------------------------------------
     * RESPONSE
     * ------------------------------------------
     */

    return res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error(
      "Mission analysis failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to calculate mission analysis"
    });
  }
}
