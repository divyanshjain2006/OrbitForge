import { useWorkspace } from "../contexts/WorkspaceContext";

export default function WorkspaceSelector({ mobile = false }) {
  const { workspaces, activeWorkspaceId, setWorkspace, isLoading, error } = useWorkspace();

  if (isLoading) {
    return <div className={`workspace-selector loading ${mobile ? 'mobile' : ''}`}>Loading workspaces...</div>;
  }

  if (error) {
    return <div className={`workspace-selector error ${mobile ? 'mobile' : ''}`}>Error loading workspaces</div>;
  }

  if (workspaces.length === 0) {
    return <div className={`workspace-selector empty ${mobile ? 'mobile' : ''}`}>No workspaces found</div>;
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div className={`workspace-selector ${mobile ? 'mobile' : ''}`}>
      {!mobile && <label htmlFor="workspace-select" className="workspace-label">Workspace:</label>}
      <div className="workspace-select-wrapper">
        <select
          id="workspace-select"
          value={activeWorkspaceId || ""}
          onChange={(e) => setWorkspace(e.target.value)}
          title={activeWorkspace?.name}
          className="workspace-select"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} ({ws.role})
            </option>
          ))}
        </select>
        <div className="workspace-select-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}
