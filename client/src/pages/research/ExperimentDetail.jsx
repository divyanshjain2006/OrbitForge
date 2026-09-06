/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getExperimentResearch, createExperimentRun, getDatasets, getDatasetVersions } from "../../services/api";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { RoleGuard } from "../../components/RoleGuard";

export default function ExperimentDetail() {
  const { activeWorkspaceId } = useWorkspace();
  const { experimentId } = useParams();
  const [experimentData, setExperimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);

  // Dataset selection UX
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [availableVersions, setAvailableVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Form state for new run (MISSION_RISK_ANALYSIS type)
  const [datasetVersionId, setDatasetVersionId] = useState("");
  const [altitude, setAltitude] = useState(400);
  const [inclination, setInclination] = useState(51.6);
  const [duration, setDuration] = useState(1);

  const fetchExperimentResearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExperimentResearch(experimentId);
      if (data.success) {
        setExperimentData(data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch experiment details");
    } finally {
      setIsLoading(false);
    }
  }, [experimentId]);

  const fetchDatasets = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const data = await getDatasets(activeWorkspaceId);
      if (data.success && data.datasets) {
        setAvailableDatasets(data.datasets);
      }
    } catch (err) {
      console.error("Failed to load datasets for run form", err);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchExperimentResearch();
    fetchDatasets();
  }, [fetchExperimentResearch, fetchDatasets]);

  // Load versions when a dataset is selected
  useEffect(() => {
    async function loadVersions() {
      if (!selectedDatasetId) {
        setAvailableVersions([]);
        setDatasetVersionId("");
        return;
      }
      setIsLoadingVersions(true);
      try {
        const data = await getDatasetVersions(selectedDatasetId);
        if (data.success && data.versions) {
          setAvailableVersions(data.versions);
          if (data.versions.length === 1) {
            setDatasetVersionId(data.versions[0].id || data.versions[0]._id);
          } else {
            setDatasetVersionId(""); // reset if multiple options exist
          }
        }
      } catch (err) {
        console.error("Failed to load dataset versions", err);
        setAvailableVersions([]);
      } finally {
        setIsLoadingVersions(false);
      }
    }
    loadVersions();
  }, [selectedDatasetId]);

  const handleRunExperiment = async (e) => {
    e.preventDefault();
    setRunError(null);
    setRunSuccess(null);
    setIsRunning(true);

    try {
      const parameters = {
        altitude: Number(altitude),
        inclination: Number(inclination),
        duration: Number(duration)
      };

      const data = await createExperimentRun(experimentId, {
        datasetVersionId: datasetVersionId || null,
        parameters
      });
      
      if (data.success) {
        setRunSuccess(`Run ${data.experimentRun?.id || data.run?.id || ''} executed successfully.`);
        await fetchExperimentResearch(); // Refresh data to get new run
      } else {
        throw new Error(data.message || "Failed to execute run");
      }
    } catch (err) {
      setRunError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading experiment details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!experimentData || !experimentData.experiment) return <div className="error-state">Experiment not found</div>;

  const experiment = experimentData.experiment;
  const project = experimentData.project;
  const runs = experimentData.latestRuns || experimentData.runs || [];

  return (
    <div className="research-page experiment-detail">
      <div style={{ marginBottom: "1rem" }}>
        {project && <Link to={`/research/projects/${project.id || project._id}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to {project.name}</Link>}
      </div>

      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>{experiment.name}</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "800px" }}>{experiment.description}</p>
        <div style={{ marginTop: "1rem" }}>
          <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "4px" }}>
            Type: {experiment.type}
          </span>
        </div>
      </header>

      <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
        <div className="run-experiment-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Execute Run</h3>
          {runError && <div style={{ color: "var(--status-danger)", marginBottom: "1rem" }}>{runError}</div>}
          {runSuccess && <div style={{ color: "var(--status-success)", marginBottom: "1rem" }}>{runSuccess}</div>}
          
          <form onSubmit={handleRunExperiment} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Dataset Version UX */}
            <div style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "4px" }}>
              <h4 style={{ margin: "0 0 1rem 0" }}>Dataset Selection</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                
                {/* Dataset Dropdown */}
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Select Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
                  >
                    <option value="" disabled>-- Choose a Dataset --</option>
                    {availableDatasets.map(ds => (
                      <option key={ds.id || ds._id} value={ds.id || ds._id}>{ds.name} ({ds.source})</option>
                    ))}
                  </select>
                </div>

                {/* Version Dropdown */}
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Select Version {isLoadingVersions && <span style={{fontSize:"0.75rem", color:"var(--accent)"}}>(Loading...)</span>}
                  </label>
                  <select
                    value={datasetVersionId}
                    onChange={(e) => setDatasetVersionId(e.target.value)}
                    required
                    disabled={!selectedDatasetId || isLoadingVersions || availableVersions.length === 0}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
                  >
                    <option value="" disabled>
                      {!selectedDatasetId ? "-- Select Dataset First --" : availableVersions.length === 0 ? "No Versions Found" : "-- Choose a Version --"}
                    </option>
                    {availableVersions.map(v => {
                      const displayDate = new Date(v.retrievedAt || v.createdAt).toLocaleString();
                      const status = v.validationStatus || "UNKNOWN";
                      return (
                        <option key={v.id || v._id} value={v.id || v._id}>
                          v{v.version} - {displayDate} [{status}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              {/* Selected Version Metadata */}
              {datasetVersionId && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--bg-panel)", borderRadius: "4px", fontSize: "0.85rem" }}>
                  {(() => {
                    const selected = availableVersions.find(v => (v.id || v._id) === datasetVersionId);
                    if (!selected) return null;
                    return (
                      <div style={{ display: "flex", gap: "1.5rem" }}>
                        <div><strong style={{ color: "var(--text-secondary)" }}>Source URI:</strong> <span style={{fontFamily:"monospace"}}>{selected.sourceUri}</span></div>
                        <div><strong style={{ color: "var(--text-secondary)" }}>Status:</strong> <span style={{color: selected.validationStatus === "VALID" ? "var(--status-success)" : "var(--text-primary)"}}>{selected.validationStatus}</span></div>
                        <div><strong style={{ color: "var(--text-secondary)" }}>Hash:</strong> <span style={{fontFamily:"monospace"}}>{selected.normalizedPayloadHash?.slice(0,15)}...</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div>
              <h4 style={{ margin: "0 0 1rem 0" }}>Analysis Parameters</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Altitude (km)</label>
                  <input type="number" value={altitude} onChange={(e) => setAltitude(e.target.value)} required style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Inclination (°)</label>
                  <input type="number" step="0.1" value={inclination} onChange={(e) => setInclination(e.target.value)} required style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Duration (years)</label>
                  <input type="number" step="0.1" value={duration} onChange={(e) => setDuration(e.target.value)} required style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isRunning || !datasetVersionId} className="action-button primary" style={{ padding: "0.5rem 1rem", borderRadius: "4px", alignSelf: "flex-start" }}>
              {isRunning ? "Executing..." : "Run Experiment"}
            </button>
          </form>
        </div>
      </RoleGuard>

      <section>
        <h2 style={{ marginBottom: "1rem" }}>Run History</h2>
        {runs.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", borderRadius: "8px", textAlign: "center" }}>
            No runs executed yet.
          </div>
        ) : (
          <div className="run-table" style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-panel)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Run ID</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Date</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <tr key={run.id || run._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace" }}>{run.id || run._id}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{new Date(run.createdAt).toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "4px", 
                        fontSize: "0.8rem",
                        backgroundColor: run.status === "COMPLETED" ? "rgba(40, 167, 69, 0.1)" : run.status === "FAILED" ? "rgba(220, 53, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
                        color: run.status === "COMPLETED" ? "var(--status-success)" : run.status === "FAILED" ? "var(--status-danger)" : "var(--status-warning)"
                      }}>
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/research/runs/${run.id || run._id}`} style={{ color: "var(--link)" }}>View Results</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

