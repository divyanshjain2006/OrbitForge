import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    }
  };

  return (
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      <div className="login-card" style={{ padding: "2rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", width: "100%", maxWidth: "400px" }}>
        <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>OrbitForge</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Enter your credentials to access the laboratory.</p>

        {error && (
          <div className="error-message" style={{ color: "var(--status-danger)", marginBottom: "1rem", padding: "0.5rem", border: "1px solid var(--status-danger)", borderRadius: "4px", backgroundColor: "rgba(220, 53, 69, 0.1)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "4px" }}
            />
          </div>

          <button type="submit" disabled={isLoading} className="action-button primary" style={{ marginTop: "1rem", width: "100%", padding: "0.75rem" }}>
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
