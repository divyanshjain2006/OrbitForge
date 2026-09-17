export const AI_ROLES = {
  SCIENTIFIC_EXPLAINER: {
    provider: process.env.SCIENTIFIC_EXPLAINER_PROVIDER || "openai",
    model: process.env.SCIENTIFIC_EXPLAINER_MODEL || "gpt-4o-mini"
  },
  RESEARCH_ASSISTANT: {
    provider: process.env.RESEARCH_ASSISTANT_PROVIDER || "openai",
    model: process.env.RESEARCH_ASSISTANT_MODEL || "gpt-4o-mini"
  },
  MISSION_ANALYST: {
    provider: process.env.MISSION_ANALYST_PROVIDER || "openai",
    model: process.env.MISSION_ANALYST_MODEL || "gpt-4o-mini"
  },
  DECISION_REVIEWER: {
    provider: process.env.DECISION_REVIEWER_PROVIDER || "openai",
    model: process.env.DECISION_REVIEWER_MODEL || "gpt-4o-mini"
  },
  SCENARIO_ANALYST: {
    provider: process.env.SCENARIO_ANALYST_PROVIDER || "openai",
    model: process.env.SCENARIO_ANALYST_MODEL || "gpt-4o-mini"
  }
};

export function getRoleConfig(role) {
  return AI_ROLES[role] || null;
}
