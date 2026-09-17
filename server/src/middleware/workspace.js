import mongoose from "mongoose";
import Mission from "../models/mission.model.js";
import Simulation from "../models/simulation.model.js";
import Challenge from "../models/challenge.model.js";
import { findMembership } from "../services/workspace.service.js";

export async function requireWorkspaceMember(req, res, next) {
  try {
    let workspaceId;
    
    if (req.params.missionId) {
      const mission = await Mission.findById(req.params.missionId).lean();
      if (!mission) return res.status(404).json({ error: "Mission not found" });
      workspaceId = mission.workspaceId;
    } else if (req.params.id) {
      if (req.baseUrl.includes("/simulations") || req.originalUrl.includes("/simulations")) {
        const simulation = await Simulation.findById(req.params.id).lean();
        if (!simulation) return res.status(404).json({ error: "Simulation not found" });
        workspaceId = simulation.workspaceId;
      } else if (req.baseUrl.includes("/challenges") || req.originalUrl.includes("/challenges")) {
        const challenge = await Challenge.findById(req.params.id).lean();
        if (!challenge) return res.status(404).json({ error: "Challenge not found" });
        workspaceId = challenge.workspaceId;
      }
    }
    
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace context could not be determined." });
    }

    const membership = await findMembership(req.auth.userId, workspaceId);
    if (!membership) {
      return res.status(403).json({ error: "Workspace access denied." });
    }

    req.workspace = { id: String(workspaceId), _id: String(workspaceId) };
    req.workspaceId = String(workspaceId);
    next();
  } catch (error) {
    next(error);
  }
}
