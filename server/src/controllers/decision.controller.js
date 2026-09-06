import Mission from "../models/mission.model.js";
import Decision from "../models/decision.model.js";
import Assessment from "../models/assessment.model.js";

import { calculateMissionRisk } from "../services/risk.service.js";

import {
  assessSpaceEnvironment
} from "../services/spaceEnvironment/spaceEnvironment.service.js";
import {
  validateScenarioAssessmentSnapshot
} from "../middleware/validation.js";

/*
 * =========================================================
 * CREATE MISSION DECISION
 * =========================================================
 *
 * The server is authoritative for the assessment snapshot.
 *
 * CURRENT_CONFIGURATION:
 *   Recalculate risk/environment from the mission stored
 *   in MongoDB.
 *
 * SCENARIO_SIMULATION:
 *   Load the referenced stored scenario assessment and use
 *   its persisted configuration/risk/environment snapshot.
 *
 * The browser may request a decision, but it does not define
 * the authoritative audit values.
 */
export async function createDecision(req, res) {
  try {
    const { missionId } = req.params;

    const {
      decision,
      reason,
      source,
      scenarioId
    } = req.body;

    const normalizedDecision =
      String(decision || "")
        .trim()
        .toUpperCase();

    const DECISION_TO_MISSION_STATUS = {
      APPROVE: "APPROVED",
      REVIEW: "HOLD",
      REJECT: "REJECTED"
    };

    /*
     * ---------------------------------------------------------
     * VALIDATE DECISION
     * ---------------------------------------------------------
     */

    if (
      !Object.prototype.hasOwnProperty.call(
        DECISION_TO_MISSION_STATUS,
        normalizedDecision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Decision must be APPROVE, REVIEW or REJECT"
      });
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE REASON
     * ---------------------------------------------------------
     */

    const trimmedReason =
      String(reason || "").trim();

    if (trimmedReason.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "A decision reason of at least 5 characters is required."
      });
    }

    /*
     * ---------------------------------------------------------
     * LOAD MISSION
     * ---------------------------------------------------------
     */

    const mission =
      await Mission.findById(missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    /*
     * ---------------------------------------------------------
     * NORMALIZE SOURCE
     * ---------------------------------------------------------
     */

    const normalizedSource =
      source === "SCENARIO_SIMULATION"
        ? "SCENARIO_SIMULATION"
        : "CURRENT_CONFIGURATION";

    let authoritativeConfiguration;
    let authoritativeRisk;
    let authoritativeEnvironment;
    let authoritativeScenarioId = null;

    /*
     * =========================================================
     * CURRENT CONFIGURATION
     * =========================================================
     *
     * Recalculate everything from the actual mission stored
     * in MongoDB.
     */

    if (
      normalizedSource ===
      "CURRENT_CONFIGURATION"
    ) {
      const calculatedRisk =
        calculateMissionRisk(mission);

      const calculatedEnvironment =
        assessSpaceEnvironment({
          altitude: mission.altitude,
          inclination: mission.inclination
        });

      authoritativeConfiguration = {
        altitude: Number(mission.altitude),
        inclination: Number(mission.inclination),
        duration: Number(mission.duration)
      };

      authoritativeRisk = {
        score: Number(
          calculatedRisk.score
        ),
        level: String(
          calculatedRisk.level
        )
      };

      authoritativeEnvironment = {
        score: Number(
          calculatedEnvironment.score
        ),
        level: String(
          calculatedEnvironment.level
        )
      };
    }

    /*
     * =========================================================
     * SCENARIO SIMULATION
     * =========================================================
     *
     * The scenario must reference an existing assessment
     * belonging to this mission.
     */

    if (
      normalizedSource ===
      "SCENARIO_SIMULATION"
    ) {
      if (!scenarioId) {
        return res.status(400).json({
          success: false,
          message:
            "scenarioId is required for scenario decisions"
        });
      }

      const scenarioAssessment =
        await Assessment.findOne({
          _id: scenarioId,
          missionId,
          type: "SCENARIO_SIMULATION"
        }).lean();

      if (!scenarioAssessment) {
        return res.status(404).json({
          success: false,
          message:
            "Referenced scenario assessment was not found"
        });
      }

      let validatedScenario;
      try {
        validatedScenario = validateScenarioAssessmentSnapshot(
          scenarioAssessment
        );
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: "Scenario assessment contains an invalid snapshot."
        });
      }

      authoritativeConfiguration = validatedScenario.configuration;
      authoritativeRisk = validatedScenario.risk;
      authoritativeEnvironment = validatedScenario.environment;

      authoritativeScenarioId =
        scenarioAssessment._id;
    }

    /*
     * ---------------------------------------------------------
     * SAFETY CHECK
     * ---------------------------------------------------------
     */

    if (
      !authoritativeConfiguration ||
      !authoritativeRisk ||
      !authoritativeEnvironment
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to produce an authoritative assessment snapshot"
      });
    }

    /*
     * =========================================================
     * CREATE IMMUTABLE DECISION HISTORY
     * =========================================================
     */

    const decisionRecord =
      await Decision.create({
        missionId,

        decision:
          normalizedDecision,

        configuration:
          authoritativeConfiguration,

        risk:
          authoritativeRisk,

        environment:
          authoritativeEnvironment,

        reason:
          trimmedReason,

        source:
          normalizedSource,

        scenarioId:
          authoritativeScenarioId
      });

    /*
     * =========================================================
     * UPDATE CURRENT MISSION STATE
     * =========================================================
     */

    const isScenarioDecision =
      normalizedSource === "SCENARIO_SIMULATION";

    const missionStatus = isScenarioDecision
      ? normalizedDecision === "APPROVE"
        ? "SCENARIO_APPROVED"
        : "PENDING_REVIEW"
      : DECISION_TO_MISSION_STATUS[
          normalizedDecision
        ];

    const missionLabel = isScenarioDecision
      ? normalizedDecision === "APPROVE"
        ? "Scenario approved — apply configuration"
        : normalizedDecision === "REVIEW"
          ? "Scenario requires review"
          : "Scenario rejected — current configuration unchanged"
      : missionStatus === "APPROVED"
        ? "Mission approved"
        : missionStatus === "HOLD"
          ? "Hold for review"
          : "Mission rejected";

    mission.decision = {
      status: missionStatus,
      label: missionLabel,
      reason: trimmedReason,
      decidedAt: new Date(),
      source: normalizedSource,
      scenarioId:
        normalizedDecision === "APPROVE" &&
        isScenarioDecision
          ? authoritativeScenarioId
          : null
    };

    try {
      await mission.save();
    } catch (missionUpdateError) {
      /*
       * Roll back the audit record if the mission state
       * cannot be persisted.
       */

      await Decision.findByIdAndDelete(
        decisionRecord._id
      );

      throw missionUpdateError;
    }

    /*
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    return res.status(201).json({
      success: true,

      decision:
        decisionRecord,

      mission
    });
  } catch (error) {
    console.error(
      "Create mission decision failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to record mission decision"
    });
  }
}

/*
 * =========================================================
 * GET MISSION DECISION HISTORY
 * =========================================================
 */

export async function getMissionDecisions(
  req,
  res
) {
  try {
    const { missionId } = req.params;

    const mission =
      await Mission.findById(missionId)
        .select("_id name")
        .lean();

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    const decisions =
      await Decision.find({ missionId })
        .sort({ createdAt: -1 })
        .lean();

    return res.json({
      success: true,
      mission,
      decisions
    });
  } catch (error) {
    console.error(
      "Get mission decisions failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve mission decisions"
    });
  }
}
