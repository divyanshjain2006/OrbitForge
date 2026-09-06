import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getDatasets } from "../../services/api";

export default function Datasets() {
  const { activeWorkspaceId } = useWorkspace();
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDatasets() {
      if (!activeWorkspaceId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDatasets(activeWorkspaceId);
        if (data.success && data.datasets) {
          setDatasets(data.datasets);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch datasets");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDatasets();
  }, [activeWorkspaceId]);

  if (isLoading) {
    return <div className="loading-state">Loading NASA datasets...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="research-page datasets-page">
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>NASA Datasets</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Explore and ingest data from NASA sources. Note that CNEOS Scout data represents preliminary/unconfirmed NEO trajectory information.
          </p>
        </div>
      </header>

      {datasets.length === 0 ? (
        <div className="empty-state" style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <h3>No Datasets Configured</h3>
          <p style={{ color: "var(--text-secondary)" }}>There are no datasets available in this workspace.</p>
        </div>
      ) : (
        <div className="dataset-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {datasets.map(dataset => (
            <Link to={`/research/datasets/${dataset.id}`} key={dataset.id} style={{ textDecoration: "none" }}>
              <div className="dataset-card" style={{ padding: "1.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", height: "100%", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>{dataset.name}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", flex: 1 }}>{dataset.description}</p>
                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--accent)" }}>{dataset.source}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{dataset.versionCount || 0} versions</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
