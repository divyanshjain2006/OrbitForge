import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import WorkspaceSelector from "./WorkspaceSelector";

function Navigation() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Overview", end: true },
    { to: "/research/datasets", label: "NASA Space Weather", authOnly: true },
    { to: "/research", label: "Research Lab", authOnly: true },
    { to: "/settings/ai", label: "AI Settings", authOnly: true },
  ];

  return (
    <header className="top-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", minWidth: 0 }}>
        <Link to="/" className="brand" style={{ flexShrink: 0 }}>
          <span className="brand-mark">OF</span>
          <span className="brand-name">OrbitForge</span>
        </Link>

        <nav className="nav-links nav-desktop-only">
          {navItems.map((item) => {
            if (item.authOnly && !isAuthenticated) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="nav-desktop-only" style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
        {isAuthenticated && <WorkspaceSelector />}

        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderLeft: "1px solid var(--border)", paddingLeft: "1rem", minWidth: 0 }}>
            <span
              title={user?.email}
              style={{ fontSize: "0.9rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}
            >
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="action-button primary" style={{ textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "4px", flexShrink: 0 }}>
            Login
          </Link>
        )}
      </div>

      <button
        className="nav-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: "pointer", flexShrink: 0 }}
      >
        ☰
      </button>

      {isMobileOpen && (
        <div className="nav-mobile-menu">
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {navItems.map((item) => {
              if (item.authOnly && !isAuthenticated) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {isAuthenticated && <WorkspaceSelector />}

          {isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                style={{ alignSelf: "flex-start", background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "0.5rem" }}>
              <Link to="/login" className="action-button primary" style={{ textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "4px", display: "inline-block" }} onClick={() => setIsMobileOpen(false)}>
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navigation;
