import {
  getMissionAssessmentHistory
} from "../services/assessment.service.js";

export async function getAssessmentHistory(
  req,
  res
) {
  try {
    const { missionId } = req.params;

    const assessments =
      await getMissionAssessmentHistory(
        missionId
      );

    return res.json({
      success: true,
      assessments
    });
  } catch (error) {
    console.error(
      "Assessment history failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve assessment history"
    });
  }
}