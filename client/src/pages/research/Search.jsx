import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchResearch } from "../../services/api";
import { useWorkspace } from "../../contexts/WorkspaceContext";

export default function ResearchSearch() {
  const { activeWorkspaceId } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [results, setResults] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "";
  const statusFilter = searchParams.get("status") || "";
  const currentCursor = searchParams.get("cursor") || "";

  useEffect(() => {
    async function performSearch() {
      if (!activeWorkspaceId) return;

      setIsLoading(true);
      setError(null);
      
      try {
        const params = {};
        if (query) params.q = query;
        if (typeFilter) params.type = typeFilter;
        if (statusFilter) params.status = statusFilter;
        if (currentCursor) params.cursor = currentCursor;
        params.limit = 20;

        const data = await searchResearch(activeWorkspaceId, params);
        if (data.success) {
          setResults(data.results || []);
          setNextCursor(data.nextCursor || null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message || "Failed to search research");
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [activeWorkspaceId, query, typeFilter, statusFilter, currentCursor]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const params = new URLSearchParams();
    if (fd.get("q")) params.set("q", fd.get("q"));
    if (fd.get("type")) params.set("type", fd.get("type"));
    if (fd.get("status")) params.set("status", fd.get("status"));
    // Reset cursor on new search
    setSearchParams(params);
  };

  const handleNextPage = () => {
    if (!nextCursor) return;
    const params = new URLSearchParams(searchParams);
    params.set("cursor", nextCursor);
    setSearchParams(params);
  };

  return (
    <div className="research-page research-search">
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Research Explorer</h1>
        <p style={{ color: "var(--text-secondary)" }}>Search across projects, datasets, experiments, runs, and records.</p>
      </header>

      <div className="search-controls" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Search Query</label>
            <input 
              type="text" 
              name="q" 
              defaultValue={query} 
              placeholder="Enter search terms..." 
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>
          
          <div style={{ flex: "0 1 200px" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Type</label>
            <select 
              name="type" 
              defaultValue={typeFilter}
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            >
              <option value="">All Types</option>
              <option value="PROJECT">Project</option>
              <option value="DATASET">Dataset</option>
              <option value="EXPERIMENT">Experiment</option>
              <option value="EXPERIMENT_RUN">Run</option>
              <option value="RESEARCH_RECORD">Research Record</option>
            </select>
          </div>

          <div style={{ flex: "0 1 200px" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Status</label>
            <select 
              name="status" 
              defaultValue={statusFilter}
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            >
              <option value="">Any Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="VERIFIED">Verified</option>
              <option value="NOT_VERIFIED">Not Verified</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="action-button primary" style={{ padding: "0.5rem 1.5rem", borderRadius: "4px", height: "35px" }}>
              Search
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-state">Error: {error}</div>}

      <div className="search-results">
        {isLoading ? (
          <div className="loading-state" style={{ padding: "3rem", textAlign: "center" }}>Searching...</div>
        ) : results.length === 0 ? (
          <div className="empty-state" style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
            <p style={{ color: "var(--text-secondary)" }}>No results found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Showing {results.length} results
            </div>
            {results.map((result, i) => {
              // Determine link path based on type
              let linkPath = "#";
              if (result.type === "PROJECT") linkPath = `/research/projects/${result.id}`;
              else if (result.type === "DATASET") linkPath = `/research/datasets/${result.id}`;
              else if (result.type === "EXPERIMENT") linkPath = `/research/experiments/${result.id}`;
              else if (result.type === "EXPERIMENT_RUN") linkPath = `/research/runs/${result.id}`;
              else if (result.type === "RESEARCH_RECORD") linkPath = `/research/records/${result.id}`;

              return (
                <Link to={linkPath} key={`${result.id}-${i}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ padding: "1.25rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", transition: "border-color 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor="var(--accent)"} onMouseOut={e => e.currentTarget.style.borderColor="var(--border)"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--link)" }}>{result.name || result.id}</h3>
                      <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-secondary)" }}>
                        {result.type}
                      </span>
                    </div>
                    {result.description && <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{result.description}</p>}
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span>ID: {result.id.substring(0, 8)}...</span>
                      {result.status && <span>Status: {result.status}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}

            {nextCursor && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button 
                  onClick={handleNextPage}
                  className="action-button secondary"
                  style={{ padding: "0.5rem 1.5rem", borderRadius: "4px" }}
                >
                  Load Next Page
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
