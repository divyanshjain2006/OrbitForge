const API_BASE_URL = "/api";

export function getAuthToken() {
  return localStorage.getItem("token");
}

async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!headers["Content-Type"] && options.body && typeof options.body === 'string') {
    headers["Content-Type"] = "application/json";
  }

  return fetch(endpoint, {
    ...options,
    headers
  });
}

export async function getHealthStatus() {
  const response = await apiFetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Unable to connect to OrbitForge backend");
  }

  return response.json();
}

export async function createMission(workspaceId, missionData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/missions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...missionData,
      altitude: Number(missionData.altitude),
      inclination: Number(missionData.inclination),
      duration: Number(missionData.duration)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create mission"
    );
  }

  return data;
}

export async function getMissions(workspaceId) {
  if (!workspaceId) return { missions: [] };
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions?_=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve missions");
  }

  return response.json();
}

export async function getMissionById(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/missions/${missionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to retrieve mission"
    );
  }

  return data;
}

export async function deleteMission(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/missions/${missionId}`,
    {
      method: "DELETE"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to delete mission"
    );
  }

  return data;
}

export async function getMissionAnalysis(workspaceId, missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/analysis`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to retrieve mission analysis"
    );
  }

  return data;
}

export async function getMissionIntelligence(workspaceId, missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/intelligence`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to retrieve mission intelligence"
    );
  }

  return data;
}
export async function analyzeScenario(
  workspaceId,
  missionId,
  scenario
) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/scenario`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scenario)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to simulate mission scenario"
    );
  }

  return data;
}
export async function getSpaceEnvironment(
  altitude,
  inclination
) {
  const params = new URLSearchParams({
    altitude,
    inclination
  });

  const response = await apiFetch(
    `${API_BASE_URL}/v1/environment?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to retrieve space environment assessment"
    );
  }

  return data;
}
export async function getMissionAssessments(workspaceId, missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/assessments?_=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to retrieve mission assessment history"
    );
  }

  return data;
}
export async function getMissionAssessmentHistory(
  workspaceId,
  missionId
) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/assessments`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to retrieve assessment history"
    );
  }

  return data;
}

export async function getMissionDecisions(workspaceId, missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/decisions?_=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to retrieve mission decisions"
    );
  }

  return data;
}

export async function createMissionDecision(
  workspaceId,
  missionId,
  decisionData
) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/workspaces/${workspaceId}/missions/${missionId}/decisions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(decisionData)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to record mission decision"
    );
  }

  return data;
}
export async function applyApprovedScenario(
  missionId,
  scenarioAssessmentId,
  appliedBy,
  notes
) {
  const response = await apiFetch(
    `${API_BASE_URL}/v1/missions/${missionId}/apply-approved-scenario`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scenarioAssessmentId,
        appliedBy,
        notes
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to apply approved scenario"
    );
  }

  return data;
}

/* =========================================================
   AUTH & WORKSPACE
   ========================================================= */

function normalizeIds(obj) {
  if (Array.isArray(obj)) return obj.map(normalizeIds);
  if (obj !== null && typeof obj === 'object') {
    const newObj = { ...obj };
    if (newObj._id && !newObj.id) newObj.id = newObj._id;
    for (const key in newObj) newObj[key] = normalizeIds(newObj[key]);
    return newObj;
  }
  return obj;
}


export class ApiError extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function parseApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Invalid JSON from server", response.status, "MALFORMED_RESPONSE", null);
  }
  if (!response.ok) {
    throw new ApiError(data.error?.message || data.message || "API request failed", response.status, data.error?.code || "API_ERROR", data);
  }
  return normalizeIds(data);
}

export async function login(email, password) {
  const response = await apiFetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  return parseApiResponse(response);
}

export async function register(email, password, displayName) {
  const response = await apiFetch(`${API_BASE_URL}/v1/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password, displayName })
  });
  return parseApiResponse(response);
}

export async function getMe() {
  const response = await apiFetch(`${API_BASE_URL}/v1/auth/me`);
  return parseApiResponse(response);
}

export async function getWorkspaces() {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces`);
  return parseApiResponse(response);
}

/* =========================================================
   DATASETS
   ========================================================= */

export async function getDatasets(workspaceId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/datasets`);
  return parseApiResponse(response);
}

export async function createDataset(workspaceId, payload) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/datasets`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return parseApiResponse(response);
}

export async function getDatasetById(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/datasets/${id}`);
  return parseApiResponse(response);
}

export async function ingestDataset(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/datasets/${id}/ingest`, { method: "POST" });
  return parseApiResponse(response);
}

export async function getDatasetVersions(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/datasets/${id}/versions`);
  return parseApiResponse(response);
}

export async function getDatasetVersionById(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/dataset-versions/${id}`);
  return parseApiResponse(response);
}

/* =========================================================
   PROJECTS
   ========================================================= */

export async function getProjects(workspaceId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/projects`);
  return parseApiResponse(response);
}

export async function getProjectById(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/projects/${id}`);
  return parseApiResponse(response);
}

export async function createProject(workspaceId, projectData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify(projectData)
  });
  return parseApiResponse(response);
}

/* =========================================================
   EXPERIMENTS & RUNS
   ========================================================= */

export async function getExperiments(projectId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/projects/${projectId}/experiments`);
  return parseApiResponse(response);
}

export async function getExperimentById(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/experiments/${id}`);
  return parseApiResponse(response);
}

export async function createExperiment(projectId, experimentData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/projects/${projectId}/experiments`, {
    method: "POST",
    body: JSON.stringify(experimentData)
  });
  return parseApiResponse(response);
}

export async function getExperimentRuns(experimentId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/experiments/${experimentId}/runs`);
  return parseApiResponse(response);
}

export async function getExperimentRunById(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/experiment-runs/${id}`);
  return parseApiResponse(response);
}

export async function createExperimentRun(experimentId, runData) {
  const formattedData = {
    datasetVersionIds: runData.datasetVersionId ? [runData.datasetVersionId] : [],
    parameters: {
      altitudeKm: Number(runData.parameters.altitude),
      inclinationDeg: Number(runData.parameters.inclination),
      durationDays: Number(runData.parameters.duration)
    },
    missionId: runData.missionId || null
  };

  const response = await apiFetch(`${API_BASE_URL}/v1/experiments/${experimentId}/runs`, {
    method: "POST",
    body: JSON.stringify(formattedData)
  });
  return parseApiResponse(response);
}

export async function reproduceRun(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/experiment-runs/${id}/reproduce`, {
    method: "POST"
  });
  return parseApiResponse(response);
}

/* =========================================================
   RESEARCH & INTEGRITY
   ========================================================= */

export async function getResearchOverview(workspaceId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/research/overview`);
  return parseApiResponse(response);
}

export async function searchResearch(workspaceId, queryParams) {
  const params = new URLSearchParams(queryParams);
  const response = await apiFetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/research/search?${params.toString()}`);
  return parseApiResponse(response);
}

export async function getProjectResearch(projectId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/projects/${projectId}/research`);
  return parseApiResponse(response);
}

export async function getExperimentResearch(experimentId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/experiments/${experimentId}/research`);
  return parseApiResponse(response);
}

export async function getResearchRecord(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/research-records/${id}`);
  return parseApiResponse(response);
}

export async function getResearchRecordProvenance(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/research-records/${id}/provenance`);
  return parseApiResponse(response);
}

export async function publishAnalysisToResearch(missionId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/missions/${missionId}/analysis-runs`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return parseApiResponse(response);
}

export async function verifyResearchRecord(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/research-records/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return parseApiResponse(response);
}

export async function getVerificationHistory(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/research-records/${id}/verifications`);
  return parseApiResponse(response);
}

/* =========================================================
   SIMULATIONS
   ========================================================= */

export async function createSimulation(missionId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/missions/${missionId}/simulations`, { method: "POST" });
  return parseApiResponse(response);
}

export async function getMissionSimulations(missionId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/missions/${missionId}/simulations`);
  return parseApiResponse(response);
}

export async function getSimulation(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/simulations/${id}`);
  return parseApiResponse(response);
}

export async function triggerSimulationEvent(id, eventData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/simulations/${id}/events`, {
    method: "POST",
    body: JSON.stringify(eventData)
  });
  return parseApiResponse(response);
}

export async function submitSimulationDecision(simulationId, decisionData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/simulations/${simulationId}/decisions`, {
    method: "POST",
    body: JSON.stringify(decisionData)
  });
  return parseApiResponse(response);
}

export async function publishSimulationToResearch(simulationId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/simulations/${simulationId}/research`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return parseApiResponse(response);
}

/* =========================================================
   MISSION CHALLENGES
   ========================================================= */

export async function getChallengeCatalog() {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/catalog`);
  return parseApiResponse(response);
}

export async function getMissionChallenges(missionId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/missions/${missionId}`);
  return parseApiResponse(response);
}

export async function createChallenge(missionId, challengeType) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/missions/${missionId}`, {
    method: "POST",
    body: JSON.stringify({ challengeType })
  });
  return parseApiResponse(response);
}

export async function getChallenge(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/${id}`);
  return parseApiResponse(response);
}

export async function startChallenge(id) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/${id}/start`, { method: "POST" });
  return parseApiResponse(response);
}

export async function submitChallengeDecision(challengeId, decisionData) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/${challengeId}/decisions`, {
    method: "POST",
    body: JSON.stringify(decisionData)
  });
  return parseApiResponse(response);
}

export async function publishChallengeToResearch(challengeId) {
  const response = await apiFetch(`${API_BASE_URL}/v1/challenges/${challengeId}/research`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return parseApiResponse(response);
}

/* =========================================================
   AI CONFIGURATION (BYOK)
   ========================================================= */

export async function getAiProviders() {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/providers`);
  return parseApiResponse(response);
}

export async function addAiProvider(provider, apiKey) {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/providers`, {
    method: "POST",
    body: JSON.stringify({ provider, apiKey })
  });
  return parseApiResponse(response);
}

export async function testAiProvider(provider) {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/providers/${provider}/test`, {
    method: "POST",
    body: JSON.stringify({})
  });
  return parseApiResponse(response);
}

export async function removeAiProvider(provider) {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/providers/${provider}`, {
    method: "DELETE"
  });
  return parseApiResponse(response);
}

export async function getAiRoles() {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/roles`);
  return parseApiResponse(response);
}

export async function updateAiRole(role, provider, model) {
  const response = await apiFetch(`${API_BASE_URL}/v1/ai-config/roles/${role}`, {
    method: "PUT",
    body: JSON.stringify({ provider, model })
  });
  return parseApiResponse(response);
}
