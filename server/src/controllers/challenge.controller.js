import {
  createChallenge,
  getMissionChallenges,
  getChallenge,
  startChallenge,
  submitChallengeDecision,
  publishChallengeToResearch
} from "../services/challenge.service.js";
import { getChallengeCatalog } from "../services/challengeCatalog.js";

export async function getCatalogController(req, res) {
  try {
    const catalog = getChallengeCatalog();
    res.json({ catalog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createChallengeController(req, res) {
  try {
    const { missionId } = req.params;
    const { challengeType } = req.body;
    const workspaceId = req.workspace._id;

    const { challenge, simulation } = await createChallenge(workspaceId, missionId, challengeType);
    res.status(201).json({ challenge, simulation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getMissionChallengesController(req, res) {
  try {
    const { missionId } = req.params;
    const workspaceId = req.workspace._id;

    const challenges = await getMissionChallenges(workspaceId, missionId);
    res.json({ challenges });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getChallengeController(req, res) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace._id;

    const challenge = await getChallenge(workspaceId, id);
    res.json({ challenge });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

export async function startChallengeController(req, res) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace._id;

    const { challenge, simulation } = await startChallenge(workspaceId, id);
    res.json({ challenge, simulation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function submitChallengeDecisionController(req, res) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace._id;

    const { challenge, simulation } = await submitChallengeDecision(workspaceId, id, req.body);
    res.json({ challenge, simulation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function publishChallengeController(req, res) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace._id;

    const result = await publishChallengeToResearch(workspaceId, id);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
