/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getExperimentRunById, reproduceRun } from "../../services/api";
import { RoleGuard } from "../../components/RoleGuard";
import { IntegrityBadge } from "../../components/trust";
import JsonViewer from "../../components/JsonViewer";

export default function RunDetail() {
  const { runId } = useParams();
  const [runData, setRunData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isReproducing, setIsReproducing] = useState(false);
  const [reproduceResult, setReproduceResult] = useState(null);

  const fetchRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend getRun returns:
      // { success, experimentRun, datasetVersions, researchRecord: { id, artifactType, integrity }, reproduction }
      const data = await getExperimentRunById(runId);
      if (data.success && data.experimentRun) {
        setRunData(data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch run details");
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  const handleReproduce = async () => {
    setIsReproducing(true);
    setReproduceResult(null);
    try {
      // Backend reproduceRun returns: { success, experimentRun, researchRecord }
      const data = await reproduceRun(runId);
      if (data.success && data.experimentRun) {
        setReproduceResult({ type: "success", run: data.experimentRun, record: data.researchRecord });
      } else {
        throw new Error(data.message || "Reproduction failed");
      }
    } catch (err) {
      setReproduceResult({ type: "error", message: err.message });
    } finally {
      setIsReproducing(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading run details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!runData || !runData.experimentRun) return <div className="error-state">Run not found</div>;

  const run = runData.experimentRun;
  const datasetVersions = runData.datasetVersions || [];
  const researchRecord = runData.researchRecord;
  const reproduction = runData.reproduction || run.reproduction;

  return (
    <div className="research-page run-detail">
      <div style={{ marginBottom: "1rem" }}>
        {run.experimentId && <Link to={`/research/experiments/${run.experimentId}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to Experiment</Link>}
      </div>

      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0" }}>Experiment Run</h1>
          <p style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.85rem" }}>{run.id || run._id}</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Started: {new Date(run.startedAt).toLocaleString()}</p>
        </div>
        
        <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
          <button 
            onClick={handleReproduce} 
            disabled={isReproducing}
            className="action-button primary"
            style={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
          >
            {isReproducing ? "Reproducing..." : "Reproduce Run"}
          </button>
        </RoleGuard>
      </header>

      {reproduceResult && (
        <div style={{ 
          padding: "1.5rem", 
          marginBottom: "2rem", 
          borderRadius: "8px",
          backgroundColor: reproduceResult.type === "success" ? "var(--bg-panel)" : "rgba(220, 53, 69, 0.1)",
          border: `1px solid ${reproduceResult.type === "success" ? "var(--status-success)" : "var(--status-danger)"}`
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: reproduceResult.type === "success" ? "var(--status-success)" : "var(--status-danger)" }}>
            {reproduceResult.type === "success" ? "Reproduction Complete" : "Reproduction Failed"}
          </h3>
          
          {reproduceResult.type === "success" ? (
            <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div>
                <strong style={{ color: "var(--text-secondary)" }}>New Run ID:</strong>{" "}
                <span style={{ fontFamily: "monospace" }}>{reproduceResult.run.id || reproduceResult.run._id}</span>
              </div>
              <div>
                <strong style={{ color: "var(--text-secondary)" }}>Status:</strong>{" "}
                <span style={{
                  padding: "0.15rem 0.4rem",
                  borderRadius: "4px",
                  backgroundColor: reproduceResult.run.status === "COMPLETED" ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                  color: reproduceResult.run.status === "COMPLETED" ? "var(--status-success)" : "var(--status-danger)"
                }}>{reproduceResult.run.status}</span>
              </div>
              {reproduceResult.run.reproduction && (
                <div>
                  <strong style={{ color: "var(--text-secondary)" }}>Reproduction Details:</strong>
                  <JsonViewer data={reproduceResult.run.reproduction} />
                </div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <Link to={`/research/runs/${reproduceResult.run.id || reproduceResult.run._id}`} onClick={() => setReproduceResult(null)} style={{ color: "var(--link)" }}>
                  View Reproduction Run →
                </Link>
              </div>
            </div>
          ) : (
            <p>{reproduceResult.message}</p>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        <div className="metadata-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Context</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div><strong style={{ color: "var(--text-secondary)" }}>Project:</strong> {run.projectId}</div>
            <div><strong style={{ color: "var(--text-secondary)" }}>Experiment:</strong> {run.experimentId}</div>
            {run.missionId && <div><strong style={{ color: "var(--text-secondary)" }}>Mission:</strong> {run.missionId}</div>}
            {run.reproducedFromRunId && <div><strong style={{ color: "var(--text-secondary)" }}>Reproduced From:</strong> <Link to={`/research/runs/${run.reproducedFromRunId}`} style={{ color: "var(--link)" }}>{run.reproducedFromRunId}</Link></div>}
            <div>
              <strong style={{ color: "var(--text-secondary)" }}>Status:</strong> 
              <span style={{ 
                marginLeft: "0.5rem",
                padding: "0.15rem 0.4rem", 
                borderRadius: "4px", 
                backgroundColor: run.status === "COMPLETED" ? "rgba(40, 167, 69, 0.1)" : run.status === "FAILED" ? "rgba(220, 53, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
                color: run.status === "COMPLETED" ? "var(--status-success)" : run.status === "FAILED" ? "var(--status-danger)" : "var(--status-warning)"
              }}>
                {run.status}
              </span>
            </div>
          </div>
        </div>

        <div className="metadata-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Parameters (Inputs)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.9rem" }}>
            {run.parameters && Object.entries(run.parameters).map(([key, value]) => (
              <div key={key}>
                <strong style={{ color: "var(--text-secondary)" }}>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Versions used */}
      {datasetVersions.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Dataset Versions Used</h3>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-panel)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Version ID</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Version</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Validation</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Retrieved</th>
                </tr>
              </thead>
              <tbody>
                {datasetVersions.map(dv => (
                  <tr key={dv.id || dv._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{dv.id || dv._id}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>v{dv.version}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        backgroundColor: dv.validationStatus === "VALID" ? "rgba(40, 167, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
                        color: dv.validationStatus === "VALID" ? "var(--status-success)" : "var(--status-warning)"
                      }}>{dv.validationStatus}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{dv.retrievedAt ? new Date(dv.retrievedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Results */}
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Results (Outputs)</h3>
        {run.results ? (
          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
            <JsonViewer data={run.results} />
          </div>
        ) : (
          <div className="empty-state" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", borderRadius: "8px", textAlign: "center" }}>
            No results available for this run.
          </div>
        )}
      </section>

      {/* Reproduction data from backend */}
      {reproduction && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Reproduction Report</h3>
          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
            <JsonViewer data={reproduction} />
          </div>
        </section>
      )}

      {/* Research Record Link */}
      {researchRecord && (
        <section>
          <div style={{ backgroundColor: "rgba(0, 123, 255, 0.05)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Research Record</h3>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <IntegrityBadge status={researchRecord.integrity?.status || "UNAVAILABLE"} compact />
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{researchRecord.artifactType}</span>
              </div>
            </div>
            <Link to={`/research/records/${researchRecord.id || researchRecord._id}`} className="action-button secondary" style={{ padding: "0.5rem 1rem", borderRadius: "4px", textDecoration: "none" }}>
              View Record
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
