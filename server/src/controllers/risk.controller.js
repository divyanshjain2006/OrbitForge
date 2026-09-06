import Mission from "../models/mission.model.js";
import { calculateMissionRisk } from "../services/risk.service.js";

export async function getMissionRisk(req, res) {
  try {
    const { missionId } = req.params;

    const mission = await Mission.findById(missionId).lean();

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: "Mission not found"
      });
    }

    const risk = calculateMissionRisk(mission);

    return res.json({
      success: true,
      mission: {
        id: mission._id,
        name: mission.name,
        altitude: mission.altitude,
        inclination: mission.inclination,
        duration: mission.duration
      },
      risk
    });
  } catch (error) {
    console.error(
      "Mission risk analysis failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to calculate mission risk"
    });
  }
}