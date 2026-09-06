import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getDatasetVersionById } from "../../services/api";
import JsonViewer from "../../components/JsonViewer";

export default function DatasetVersionDetail() {
  const { datasetId, versionId } = useParams();
  const [version, setVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVersion() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDatasetVersionById(versionId);
        if (data.success && data.version) {
          setVersion(data.version);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch dataset version");
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersion();
  }, [versionId]);

  if (isLoading) return <div className="loading-state">Loading dataset version...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!version) return <div className="error-state">Dataset version not found</div>;

  return (
    <div className="research-page dataset-version-detail">
      <div style={{ marginBottom: "1rem" }}>
        <Link to={`/research/datasets/${datasetId}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to Dataset</Link>
      </div>

      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Version: {version.versionId || version.id}</h1>
        <p style={{ color: "var(--text-secondary)" }}>Retrieved at: {new Date(version.createdAt || version.retrievedAt).toLocaleString()}</p>
      </header>

      <div className="metadata-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>Integrity & Validation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", fontSize: "0.9rem" }}>
          <div>
            <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Raw Payload SHA-256:</strong> 
            <code style={{ backgroundColor: "var(--bg-input)", padding: "0.25rem 0.5rem", borderRadius: "4px", color: "var(--accent)", display: "block", wordBreak: "break-all" }}>
              {version.rawSha256 || "sha256:..."}
            </code>
          </div>
          <div>
            <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Normalized Payload SHA-256:</strong> 
            <code style={{ backgroundColor: "var(--bg-input)", padding: "0.25rem 0.5rem", borderRadius: "4px", color: "var(--accent)", display: "block", wordBreak: "break-all" }}>
              {version.normalizedSha256 || "sha256:..."}
            </code>
          </div>
          <div>
            <strong style={{ color: "var(--text-secondary)", display: "inline-block", marginRight: "1rem" }}>Validation Status:</strong> 
            <span style={{ 
              padding: "0.25rem 0.5rem", 
              borderRadius: "4px", 
              fontSize: "0.8rem",
              backgroundColor: version.validationStatus === "VALID" ? "rgba(40, 167, 69, 0.1)" : version.validationStatus === "INVALID" ? "rgba(220, 53, 69, 0.1)" : "rgba(255, 193, 7, 0.1)",
              color: version.validationStatus === "VALID" ? "var(--status-success)" : version.validationStatus === "INVALID" ? "var(--status-danger)" : "var(--status-warning)",
              fontWeight: "bold"
            }}>
              {version.validationStatus || "NOT_VALIDATED"}
            </span>
          </div>
        </div>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Normalized Payload</h3>
        <JsonViewer data={version.normalizedPayload || version.payload || {}} initiallyExpanded={false} />
      </section>

      <section>
        <h3 style={{ marginBottom: "1rem" }}>Raw NASA Payload</h3>
        <JsonViewer data={version.rawPayload || { note: "Raw payload omitted for brevity" }} initiallyExpanded={false} />
      </section>
    </div>
  );
}
