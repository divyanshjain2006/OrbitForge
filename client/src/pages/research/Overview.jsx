import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getResearchOverview } from "../../services/api";
import { useWorkspace } from "../../contexts/WorkspaceContext";


export default function ResearchOverview() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOverview() {
      if (!activeWorkspaceId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getResearchOverview(activeWorkspaceId);
        if (data.success && data.overview) {
          setOverview(data.overview);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch research overview");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOverview();
  }, [activeWorkspaceId]);

  if (isLoading) return <div className="loading-state">Loading Research Lab...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!overview) return null;

  const { counts = {}, integrityCounts = {}, recentActivity = {} } = overview;

  return (
    <div className="research-page research-overview">
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Research Command Center</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Workspace: <strong style={{ color: "var(--text-primary)" }}>{activeWorkspace?.name}</strong>
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
        {/* Workspace Overview */}
        <section className="overview-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Workspace Overview</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Link to="/research/projects" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)", marginBottom: "0.25rem" }}>{counts.projects || 0}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Projects</div>
              </div>
            </Link>
            
            <Link to="/research/datasets" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)", marginBottom: "0.25rem" }}>{counts.datasets || 0}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Datasets</div>
              </div>
            </Link>

            <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{counts.experiments || 0}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Experiments</div>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{counts.runs || 0}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total Runs</div>
            </div>
          </div>
        </section>

        {/* Integrity */}
        <section className="integrity-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Integrity Status</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "rgba(40, 167, 69, 0.05)", borderLeft: "3px solid var(--status-success)", borderRadius: "0 4px 4px 0" }}>
              <span style={{ fontWeight: "bold", color: "var(--status-success)" }}>VERIFIED</span>
              <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{integrityCounts.verified || 0}</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "rgba(255, 193, 7, 0.05)", borderLeft: "3px solid var(--status-warning)", borderRadius: "0 4px 4px 0" }}>
              <span style={{ fontWeight: "bold", color: "var(--status-warning)" }}>NOT VERIFIED</span>
              <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{integrityCounts.notVerified || 0}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "rgba(220, 53, 69, 0.05)", borderLeft: "3px solid var(--status-danger)", borderRadius: "0 4px 4px 0" }}>
              <span style={{ fontWeight: "bold", color: "var(--status-danger)" }}>FAILED</span>
              <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{integrityCounts.failed || 0}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "var(--bg-input)", borderLeft: "3px solid var(--text-secondary)", borderRadius: "0 4px 4px 0" }}>
              <span style={{ fontWeight: "bold", color: "var(--text-secondary)" }}>UNAVAILABLE</span>
              <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--text-secondary)" }}>{integrityCounts.unavailable || 0}</span>
            </div>
          </div>
        </section>
      </div>

      <section style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>Recent Activity</h2>
        
        {recentActivity.runs && recentActivity.runs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentActivity.runs.map(run => (
              <div key={run.id} style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px" }}>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginRight: "1rem" }}>{new Date(run.createdAt).toLocaleDateString()}</span>
                  <strong style={{ marginRight: "0.5rem" }}>Run executed</strong>
                  <Link to={`/research/runs/${run.id}`} style={{ color: "var(--link)" }}>{run.id}</Link>
                </div>
                <span style={{ 
                  fontSize: "0.75rem", padding: "0.15rem 0.4rem", borderRadius: "4px",
                  backgroundColor: run.status === "COMPLETED" ? "rgba(40, 167, 69, 0.1)" : run.status === "FAILED" ? "rgba(220, 53, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
                  color: run.status === "COMPLETED" ? "var(--status-success)" : run.status === "FAILED" ? "var(--status-danger)" : "var(--status-warning)"
                }}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No recent activity found.
          </div>
        )}
      </section>
    </div>
  );
}
