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

export async function createMission(missionData) {
  const response = await apiFetch(`${API_BASE_URL}/missions`, {
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

export async function getMissions() {
  const response = await apiFetch(
    `${API_BASE_URL}/missions?_=${Date.now()}`,
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
    `${API_BASE_URL}/missions/${missionId}`
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
    `${API_BASE_URL}/missions/${missionId}`,
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

export async function getMissionAnalysis(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/analysis/${missionId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to retrieve mission analysis"
    );
  }

  return data;
}

export async function getMissionIntelligence(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/intelligence/${missionId}`
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
export async function runScenario(
  missionId,
  scenarioData
) {
  const response = await apiFetch(
    `${API_BASE_URL}/scenario/${missionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        altitude: Number(scenarioData.altitude),
        inclination: Number(scenarioData.inclination),
        duration: Number(scenarioData.duration)
      })
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
    altitude: String(altitude),
    inclination: String(inclination)
  });

  const response = await apiFetch(
    `${API_BASE_URL}/environment?${params.toString()}`
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
export async function getMissionAssessments(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/assessments/${missionId}?_=${Date.now()}`,
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
  missionId
) {
  const response = await apiFetch(
    `${API_BASE_URL}/assessments/${missionId}`
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

export async function getMissionDecisions(missionId) {
  const response = await apiFetch(
    `${API_BASE_URL}/decisions/${missionId}?_=${Date.now()}`,
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
  missionId,
  decisionData
) {
  const response = await apiFetch(
    `${API_BASE_URL}/decisions/${missionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: decisionData.decision,
        reason: decisionData.reason,
        source:
          decisionData.source ||
          "CURRENT_CONFIGURATION",
        scenarioId:
          decisionData.scenarioId || null
      })
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
  scenarioId
) {
  const response = await apiFetch(
    `${API_BASE_URL}/missions/${missionId}/apply-approved-scenario`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scenarioId
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
