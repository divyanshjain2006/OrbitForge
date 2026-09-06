import {
  createMission,
  getMissions,
  getMissionById,
  deleteMission,
  applyMissionConfiguration
} from "../services/mission.service.js";

import Assessment from "../models/assessment.model.js";
import Decision from "../models/decision.model.js";
import {
  validateScenarioAssessmentSnapshot
} from "../middleware/validation.js";
import { recordAuditEvent } from "../services/audit.service.js";

export async function createMissionController(req, res) {
  try {
    const mission = await createMission({ ...req.body, ...(req.workspaceId ? { workspaceId: req.workspaceId } : {}) });

    if (req.auth) void recordAuditEvent({ action: "MISSION_CREATE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId || null, resourceType: "Mission", resourceId: String(mission._id), requestId: req.requestId });

    res.status(201).json({
      success: true,
      mission
    });
  } catch (error) {
    console.error("Create mission error:", error.message);

    res.status(400).json({
      success: false,
      message: "Unable to create mission"
    });
  }
}

export async function getMissionsController(req, res) {
  try {
    const missions = await getMissions(req.workspaceId);

    res.json({
      success: true,
      missions
    });
  } catch (error) {
    console.error("Get missions error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve missions"
    });
  }
}

export async function getMissionByIdController(req, res) {
  try {
    const mission = await getMissionById(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    res.json({
      success: true,
      mission
    });
  } catch (error) {
    console.error("Get mission error:", error.message);

    res.status(400).json({
      success: false,
      message: "Invalid mission ID"
    });
  }
}

export async function deleteMissionController(req, res) {
  try {
    const mission = await deleteMission(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    if (req.auth) void recordAuditEvent({ action: "MISSION_DELETE", outcome: "SUCCESS", actorId: req.auth.userId, workspaceId: req.workspaceId || null, resourceType: "Mission", resourceId: String(mission._id), requestId: req.requestId });

    res.json({
      success: true,
      message: "Mission deleted successfully",
      mission
    });
  } catch (error) {
    console.error("Delete mission error:", error.message);

    res.status(400).json({
      success: false,
      message: "Invalid mission ID"
    });
  }
}

/*
 * =========================================================
 * APPLY APPROVED SCENARIO
 * =========================================================
 */

export async function applyApprovedScenarioController(
  req,
  res
) {
  try {
    const { id } = req.params;

    const {
      scenarioId
    } = req.body;

    if (!scenarioId) {
      return res.status(400).json({
        success: false,
        message:
          "scenarioId is required"
      });
    }

    /*
     * ---------------------------------------------------------
     * Verify mission
     * ---------------------------------------------------------
     */

    const mission =
      await getMissionById(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    if (
      mission.decision?.status !==
        "SCENARIO_APPROVED" ||
      String(mission.decision?.scenarioId || "") !==
        String(scenarioId)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This scenario is not the currently approved scenario for the mission."
      });
    }

    /*
     * ---------------------------------------------------------
     * Find the decision that approved this scenario
     * ---------------------------------------------------------
     */

    const approvedDecision =
      await Decision.findOne({
        missionId: id,
        scenarioId,
        decision: "APPROVE",
        source: "SCENARIO_SIMULATION"
      })
        .sort({
          createdAt: -1
        })
        .lean();

    if (!approvedDecision) {
      return res.status(400).json({
        success: false,
        message:
          "No approved scenario decision was found for this mission."
      });
    }

    /*
     * ---------------------------------------------------------
     * Verify the persisted scenario assessment
     * ---------------------------------------------------------
     */

    const scenarioAssessment =
      await Assessment.findOne({
        _id: scenarioId,
        missionId: id,
        type: "SCENARIO_SIMULATION"
      }).lean();

    if (!scenarioAssessment) {
      return res.status(404).json({
        success: false,
        message:
          "Scenario assessment not found."
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
        message:
          "Scenario assessment contains an invalid snapshot."
      });
    }

    /*
     * ---------------------------------------------------------
     * Apply the persisted scenario configuration
     * ---------------------------------------------------------
     */

    const updatedMission =
      await applyMissionConfiguration(
        id,
        validatedScenario.configuration
      );

    return res.json({
      success: true,

      message:
        "Approved scenario applied successfully. Mission returned to pending review for reassessment.",

      mission:
        updatedMission,

      appliedScenario: {
        assessmentId:
          scenarioAssessment._id,

        configuration: {
          altitude:
            validatedScenario.configuration.altitude,

          inclination:
            validatedScenario.configuration.inclination,

          duration:
            validatedScenario.configuration.duration
        },

        approvedDecisionId:
          approvedDecision._id
      }
    });
  } catch (error) {
    console.error(
      "Apply approved scenario error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to apply approved scenario"
    });
  }
}
