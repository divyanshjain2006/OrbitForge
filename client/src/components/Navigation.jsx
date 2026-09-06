import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import WorkspaceSelector from "./WorkspaceSelector";

function Navigation() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link to="/" className="brand">
          <span className="brand-mark">OF</span>
          <span className="brand-name">OrbitForge</span>
        </Link>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Mission Lab
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/research"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Research Lab
            </NavLink>
          )}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {isAuthenticated && <WorkspaceSelector />}
        
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderLeft: "1px solid var(--border)", paddingLeft: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{user?.email}</span>
            <button 
              onClick={handleLogout}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="action-button primary" style={{ textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "4px" }}>
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navigation;