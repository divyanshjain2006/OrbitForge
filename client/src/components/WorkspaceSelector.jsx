import { useWorkspace } from "../contexts/WorkspaceContext";

export default function WorkspaceSelector() {
  const { workspaces, activeWorkspaceId, setWorkspace, isLoading, error } = useWorkspace();

  if (isLoading) {
    return <div className="workspace-selector loading">Loading workspaces...</div>;
  }

  if (error) {
    return <div className="workspace-selector error">Error loading workspaces</div>;
  }

  if (workspaces.length === 0) {
    return <div className="workspace-selector empty">No workspaces found</div>;
  }

  return (
    <div className="workspace-selector" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <label htmlFor="workspace-select" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Workspace:</label>
      <select
        id="workspace-select"
        value={activeWorkspaceId || ""}
        onChange={(e) => setWorkspace(e.target.value)}
        style={{
          padding: "0.25rem 0.5rem",
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem"
        }}
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name} ({ws.role})
          </option>
        ))}
      </select>
    </div>
  );
}
