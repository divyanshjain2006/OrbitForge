// Static definition of challenge types and their stages
const CHALLENGE_CATALOG = {
  MISSION_CONTROL: {
    type: "MISSION_CONTROL",
    title: "Mission Control: Routine Operations",
    description: "Manage a satellite through a sequence of standard operational challenges.",
    objective: "Maintain orbital parameters and minimize risk while reacting to environmental shifts.",
    stages: [
      {
        stageIndex: 0,
        event: {
          type: "ENVIRONMENTAL_CHANGE",
          description: "Minor solar activity increases drag.",
          parameters: { severity: "LOW" }
        },
        availableDecisions: ["MAINTAIN_ORBIT", "ADJUST_ORBIT", "GATHER_MORE_DATA"]
      },
      {
        stageIndex: 1,
        event: {
          type: "ORBIT_CONFIGURATION_CHANGE",
          description: "Debris field detected in current trajectory.",
          parameters: { severity: "HIGH" }
        },
        availableDecisions: ["ADJUST_ORBIT", "SAFE_MODE"]
      }
    ],
    scoringRules: {
      "MAINTAIN_ORBIT": 0,
      "ADJUST_ORBIT": -10,
      "SAFE_MODE": -20,
      "GATHER_MORE_DATA": -5
    }
  },
  ENVIRONMENTAL_RESPONSE: {
    type: "ENVIRONMENTAL_RESPONSE",
    title: "Environmental Response: Severe Weather",
    description: "Navigate a satellite through a severe space weather event.",
    objective: "Survive the weather event with minimal operational downtime.",
    stages: [
      {
        stageIndex: 0,
        event: {
          type: "ENVIRONMENTAL_CHANGE",
          description: "Major solar flare detected. High radiation expected.",
          parameters: { severity: "HIGH" }
        },
        availableDecisions: ["SAFE_MODE", "GATHER_MORE_DATA", "MAINTAIN_ORBIT"]
      }
    ],
    scoringRules: {
      "MAINTAIN_ORBIT": -30, // Bad idea during a flare
      "SAFE_MODE": 0, // Expected action
      "GATHER_MORE_DATA": -10
    }
  }
};

export function getChallengeCatalog() {
  return Object.values(CHALLENGE_CATALOG);
}

export function getChallengeDefinition(type) {
  return CHALLENGE_CATALOG[type];
}
