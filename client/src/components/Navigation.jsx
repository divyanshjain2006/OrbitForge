import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import WorkspaceSelector from "./WorkspaceSelector";

function Navigation() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileOpen(false);
      }
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, isProfileOpen]);

  const navItems = [
    { to: "/", label: "Overview", end: true },
    { to: "/research/datasets", label: "Space Weather", authOnly: true },
    { to: "/research", label: "Research Lab", authOnly: true },
    { to: "/settings/ai", label: "AI Settings", authOnly: true },
  ];

  return (
    <header className={`top-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-brand-group">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <span className="brand-mark-inner">OF</span>
            </span>
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
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-link-text">{item.label}</span>
                  <span className="nav-link-indicator"></span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="nav-actions nav-desktop-only">
          {isAuthenticated && <WorkspaceSelector />}

          {isAuthenticated ? (
            <div className="user-profile-group" ref={profileRef}>
              <button 
                className="user-info-button" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title={user?.email}
              >
                <span className="user-avatar">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                <span className="user-email">{user?.email}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: 0.7 }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {isProfileOpen && (
                <div className="profile-dropdown">
                  <Link to="/settings/profile" className="profile-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                    Profile
                  </Link>
                  <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); handleLogout(); }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="button button-primary button-glow">
              Login
            </Link>
          )}
        </div>

        <button
          className={`nav-mobile-toggle ${isMobileOpen ? "open" : ""}`}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-mobile-menu ${isMobileOpen ? "open" : ""}`} ref={menuRef}>
          <div className="nav-mobile-content">
            <nav className="nav-mobile-links">
              {navItems.map((item) => {
                if (item.authOnly && !isAuthenticated) return null;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-mobile-link ${isActive ? "active" : ""}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="nav-mobile-actions">
              {isAuthenticated && (
                <div className="mobile-workspace-wrapper">
                  <WorkspaceSelector mobile />
                </div>
              )}

              {isAuthenticated ? (
                <div className="mobile-user-actions">
                  <div className="mobile-user-info">
                    <span className="user-avatar">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                  <button className="button button-secondary full-width" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="button button-primary button-glow full-width" onClick={() => setIsMobileOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {isMobileOpen && <div className="nav-mobile-overlay" onClick={() => setIsMobileOpen(false)}></div>}
    </header>
  );
}

export default Navigation;
