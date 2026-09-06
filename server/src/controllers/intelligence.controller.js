import Mission from "../models/mission.model.js";

import { calculateMissionRisk } from "../services/risk.service.js";

import {
  generateMissionIntelligence
} from "../services/intelligence/missionIntelligence.service.js";

import {
  assessSpaceEnvironment
} from "../services/spaceEnvironment/spaceEnvironment.service.js";

export async function getMissionIntelligence(req, res) {
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

    const risk =
      calculateMissionRisk(mission);

    const environment =
      assessSpaceEnvironment({
        altitude: mission.altitude,
        inclination: mission.inclination
      });

    const intelligence =
      generateMissionIntelligence(
        mission,
        risk,
        environment
      );

    return res.json({
      success: true,

      mission: {
        id: mission._id,
        name: mission.name,
        altitude: mission.altitude,
        inclination: mission.inclination,
        duration: mission.duration
      },

      intelligence
    });
  } catch (error) {
    console.error(
      "Mission intelligence failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate mission intelligence"
    });
  }
}