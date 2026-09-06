import { Outlet, NavLink } from "react-router-dom";
import { useWorkspace } from "../contexts/WorkspaceContext";

export default function ResearchLayout() {
  const { activeWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="research-layout" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>No Workspace Selected</h2>
        <p style={{ color: "var(--text-secondary)" }}>Please select a workspace from the top navigation to view the Research Lab.</p>
      </div>
    );
  }

  return (
    <div className="research-layout" style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
      <aside className="research-sidebar" style={{ width: "250px", borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-panel)", padding: "1rem 0" }}>
        <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 1rem", marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            Research Lab
          </div>
          
          <NavLink
            to="/research"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderLeft: "3px solid transparent" }}
          >
            Overview
          </NavLink>

          <NavLink
            to="/research/search"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderLeft: "3px solid transparent" }}
          >
            Search
          </NavLink>

          <NavLink
            to="/research/datasets"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderLeft: "3px solid transparent" }}
          >
            NASA Datasets
          </NavLink>

          <NavLink
            to="/research/projects"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", textDecoration: "none", borderLeft: "3px solid transparent" }}
          >
            Projects
          </NavLink>
        </nav>
      </aside>

      <main className="research-content" style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
