import Mission from "../models/mission.model.js";
import Assessment from "../models/assessment.model.js";
import Decision from "../models/decision.model.js";

export async function createMission(
  missionData
) {
  const mission =
    await Mission.create(missionData);

  return mission;
}

export async function getMissions(workspaceId = null) {
  return Mission.find(workspaceId ? { workspaceId } : {})
    .sort({ createdAt: -1 });
}

export async function getMissionById(
  missionId
) {
  return Mission.findById(missionId);
}

export async function deleteMission(
  missionId
) {
  const mission = await Mission.findByIdAndDelete(
    missionId
  );

  if (!mission) {
    return null;
  }

  await Promise.all([
    Assessment.deleteMany({ missionId: mission._id }),
    Decision.deleteMany({ missionId: mission._id })
  ]);

  return mission;
}

export async function applyMissionConfiguration(
  missionId,
  configuration
) {
  const mission =
    await Mission.findById(missionId);

  if (!mission) {
    return null;
  }

  mission.altitude =
    Number(configuration.altitude);

  mission.inclination =
    Number(configuration.inclination);

  mission.duration =
    Number(configuration.duration);

  /*
   * The configuration has changed, therefore the
   * previous approval/review/rejection is no longer
   * automatically valid for the new configuration.
   */
  mission.decision = {
    status: "PENDING_REVIEW",
    label: "Pending review",
    reason: "",
    decidedAt: null,
    source: "CURRENT_CONFIGURATION",
    scenarioId: null
  };

  await mission.save();

  return mission;
}
