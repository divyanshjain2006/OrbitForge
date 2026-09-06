/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectResearch, createExperiment } from "../../services/api";
import { RoleGuard } from "../../components/RoleGuard";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreatingExp, setIsCreatingExp] = useState(false);
  const [newExpName, setNewExpName] = useState("");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpType, setNewExpType] = useState("MISSION_RISK_ANALYSIS");
  const [createError, setCreateError] = useState(null);

  const fetchProjectResearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjectResearch(projectId);
      if (data.success) {
        setProjectData(data); // Expects { project, experiments, datasets, runs, researchRecords }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch project research");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectResearch();
  }, [fetchProjectResearch]);

  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreatingExp(true);

    try {
      const data = await createExperiment(projectId, {
        name: newExpName,
        description: newExpDesc,
        type: newExpType
      });
      
      if (data.success) {
        setNewExpName("");
        setNewExpDesc("");
        await fetchProjectResearch(); // Refresh data to get new experiment
      } else {
        throw new Error(data.message || "Failed to create experiment");
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreatingExp(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading project details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!projectData || !projectData.project) return <div className="error-state">Project not found</div>;

  const { project, experiments = [] } = projectData;

  return (
    <div className="research-page project-detail">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/research/projects" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to Projects</Link>
      </div>

      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>{project.name}</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "800px" }}>{project.description}</p>
      </header>

      <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
        <div className="create-experiment-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Design New Experiment</h3>
          {createError && <div style={{ color: "var(--status-danger)", marginBottom: "1rem" }}>{createError}</div>}
          <form onSubmit={handleCreateExperiment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Experiment Name</label>
                <input 
                  type="text" 
                  value={newExpName} 
                  onChange={(e) => setNewExpName(e.target.value)} 
                  required 
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Experiment Type</label>
                <select 
                  value={newExpType} 
                  onChange={(e) => setNewExpType(e.target.value)} 
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
                >
                  <option value="MISSION_RISK_ANALYSIS">MISSION_RISK_ANALYSIS</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Description</label>
              <textarea 
                value={newExpDesc} 
                onChange={(e) => setNewExpDesc(e.target.value)} 
                style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px", resize: "vertical", minHeight: "60px" }}
              />
            </div>
            <button type="submit" disabled={isCreatingExp} className="action-button primary" style={{ padding: "0.5rem 1rem", borderRadius: "4px", alignSelf: "flex-start" }}>
              {isCreatingExp ? "Creating..." : "Create Experiment"}
            </button>
          </form>
        </div>
      </RoleGuard>

      <section>
        <h2 style={{ marginBottom: "1rem" }}>Experiments</h2>
        {experiments.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", borderRadius: "8px", textAlign: "center" }}>
            No experiments designed yet.
          </div>
        ) : (
          <div className="experiment-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {experiments.map(exp => (
              <Link to={`/research/experiments/${exp.id}`} key={exp.id} style={{ textDecoration: "none" }}>
                <div className="experiment-card" style={{ padding: "1.25rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.25rem 0", color: "var(--text-primary)" }}>{exp.name}</h3>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>{exp.description}</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-secondary)" }}>
                      {exp.type}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
