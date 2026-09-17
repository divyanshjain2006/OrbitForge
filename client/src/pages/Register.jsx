import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Register() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!displayName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register(email, password, displayName);
      // Navigation will happen because checkAuth re-evaluates routes,
      // but explicitly going to `from` is also good.
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.data?.error?.message || err.message || "Failed to register. Please try again.");
    }
  };

  return (
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      <div className="login-card" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>OrbitForge</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Create an account to join the laboratory.</p>

        {error && (
          <div className="error-message" style={{ color: "var(--status-danger)", marginBottom: "1rem", padding: "0.5rem", border: "1px solid var(--status-danger)", borderRadius: "4px", backgroundColor: "rgba(220, 53, 69, 0.1)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="displayName" style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Full Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={100}
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label htmlFor="password" style={{ color: "var(--text-primary)", margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide 👁" : "Show 👁"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label htmlFor="confirmPassword" style={{ color: "var(--text-primary)", margin: 0 }}>Confirm Password</label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              >
                {showConfirmPassword ? "Hide 👁" : "Show 👁"}
              </button>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <button type="submit" disabled={isLoading} className="action-button primary" style={{ marginTop: "1rem", width: "100%", padding: "0.75rem" }}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Already have an account? </span>
            <Link to="/login" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
