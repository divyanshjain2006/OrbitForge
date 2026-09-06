import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getDatasetById, ingestDataset, getDatasetVersions } from "../../services/api";
import { RoleGuard } from "../../components/RoleGuard";

export default function DatasetDetail() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null); // success, error, network/API failure, etc.

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [datasetRes, versionsRes] = await Promise.all([
          getDatasetById(id),
          getDatasetVersions(id)
        ]);

        if (datasetRes.success && datasetRes.dataset) {
          setDataset(datasetRes.dataset);
        }
        if (versionsRes.success && versionsRes.versions) {
          setVersions(versionsRes.versions);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch dataset details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleIngest = async () => {
    setIsIngesting(true);
    setIngestStatus(null);
    try {
      const data = await ingestDataset(id);
      if (data.success) {
        setIngestStatus({ type: "success", message: "Ingestion completed successfully." });
        // Refresh versions
        const versionsRes = await getDatasetVersions(id);
        if (versionsRes.success) setVersions(versionsRes.versions);
      } else {
        setIngestStatus({ type: "error", message: data.message || "Ingestion failed." });
      }
    } catch (err) {
      setIngestStatus({ type: "error", message: err.message || "Network or API failure during ingestion." });
    } finally {
      setIsIngesting(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading dataset details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!dataset) return <div className="error-state">Dataset not found</div>;

  return (
    <div className="research-page dataset-detail">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/research/datasets" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to Datasets</Link>
      </div>

      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0" }}>{dataset.name}</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "800px" }}>{dataset.description}</p>
        </div>
        
        <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
          <button 
            onClick={handleIngest} 
            disabled={isIngesting}
            className="action-button primary"
            style={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
          >
            {isIngesting ? "Ingesting..." : "Ingest Latest Data"}
          </button>
        </RoleGuard>
      </header>

      {ingestStatus && (
        <div style={{ 
          padding: "1rem", 
          marginBottom: "2rem", 
          borderRadius: "4px",
          backgroundColor: ingestStatus.type === "success" ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
          border: `1px solid ${ingestStatus.type === "success" ? "var(--status-success)" : "var(--status-danger)"}`
        }}>
          {ingestStatus.message}
        </div>
      )}

      <div className="metadata-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>Metadata</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
          <div><strong style={{ color: "var(--text-secondary)" }}>Source:</strong> <span style={{ color: "var(--accent)" }}>{dataset.source}</span></div>
          <div><strong style={{ color: "var(--text-secondary)" }}>Status:</strong> {dataset.status || "Active"}</div>
          {dataset.sourceUri && (
            <div style={{ gridColumn: "1 / -1" }}>
              <strong style={{ color: "var(--text-secondary)" }}>Source URI:</strong> 
              <a href={dataset.sourceUri} target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)", marginLeft: "0.5rem" }}>{dataset.sourceUri}</a>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 style={{ marginBottom: "1rem" }}>Dataset Versions</h2>
        {versions.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", borderRadius: "8px", textAlign: "center" }}>
            No versions ingested yet.
          </div>
        ) : (
          <div className="versions-table" style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-panel)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Version Identity</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Validation</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map(version => (
                  <tr key={version.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace" }}>{version.versionId || version.id}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{new Date(version.createdAt || version.retrievedAt).toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "4px", 
                        fontSize: "0.8rem",
                        backgroundColor: version.validationStatus === "VALID" ? "rgba(40, 167, 69, 0.1)" : version.validationStatus === "INVALID" ? "rgba(220, 53, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
                        color: version.validationStatus === "VALID" ? "var(--status-success)" : version.validationStatus === "INVALID" ? "var(--status-danger)" : "var(--status-warning)"
                      }}>
                        {version.validationStatus || "NOT_VALIDATED"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/research/datasets/${id}/versions/${version.id}`} style={{ color: "var(--link)" }}>Inspect</Link>
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
