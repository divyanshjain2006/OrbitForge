import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getProjects, createProject } from "../../services/api";
import { RoleGuard } from "../../components/RoleGuard";

export default function Projects() {
  const { activeWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!activeWorkspaceId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjects(activeWorkspaceId);
        if (data.success && data.projects) {
          setProjects(data.projects);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch projects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [activeWorkspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const data = await createProject(activeWorkspaceId, {
        name: newProjectName,
        description: newProjectDesc
      });
      
      if (data.success && data.project) {
        setProjects([...projects, data.project]);
        setNewProjectName("");
        setNewProjectDesc("");
        // Close form or show success message if desired
      } else {
        throw new Error(data.message || "Failed to create project");
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading projects...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="research-page projects-page">
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0 }}>Research Projects</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Organize scientific studies, risk analyses, and mission experiments.
          </p>
        </div>
      </header>

      <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
        <div className="create-project-panel" style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0" }}>Create New Project</h3>
          {createError && <div style={{ color: "var(--status-danger)", marginBottom: "1rem" }}>{createError}</div>}
          <form onSubmit={handleCreateProject} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="Project Name (e.g., Low-Earth Orbit Debris Risk Study)" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)} 
                required 
                style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px", marginBottom: "0.5rem" }}
              />
              <textarea 
                placeholder="Description" 
                value={newProjectDesc} 
                onChange={(e) => setNewProjectDesc(e.target.value)} 
                style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px", resize: "vertical", minHeight: "60px" }}
              />
            </div>
            <button type="submit" disabled={isCreating} className="action-button primary" style={{ padding: "0.75rem 1.5rem", borderRadius: "4px", height: "fit-content" }}>
              {isCreating ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      </RoleGuard>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <h3>No Projects Found</h3>
          <p style={{ color: "var(--text-secondary)" }}>Create a project to start running experiments.</p>
        </div>
      ) : (
        <div className="project-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
          {projects.map(project => (
            <Link to={`/research/projects/${project.id}`} key={project.id} style={{ textDecoration: "none" }}>
              <div className="project-card" style={{ padding: "1.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>{project.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>{project.description}</p>
                </div>
                <div style={{ display: "flex", gap: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  <div>
                    <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "1.1rem" }}>{project.experimentCount || 0}</strong>
                    Experiments
                  </div>
                  <div>
                    <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "1.1rem" }}>{project.runCount || 0}</strong>
                    Runs
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
