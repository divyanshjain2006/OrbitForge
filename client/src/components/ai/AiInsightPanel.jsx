import { useState } from "react";
import ErrorState from "../ErrorState";
import { useWorkspace } from "../../contexts/WorkspaceContext";

export default function AiInsightPanel({ role, contextRefs, buttonLabel = "Generate AI Insight" }) {
  const { activeWorkspaceId } = useWorkspace();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/workspaces/${activeWorkspaceId}/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          contextRefs
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw { status: res.status, message: data.message || "Failed to generate AI insight." };
      }

      setInsight(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="ai-insight-panel error" style={{ border: "1px solid var(--status-danger)", borderRadius: "8px", padding: "1rem", marginTop: "1rem" }}>
        <h4 style={{ color: "var(--status-danger)", margin: "0 0 0.5rem 0" }}>AI Intelligence Unavailable</h4>
        <ErrorState error={error} onRetry={handleGenerate} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-insight-panel loading" style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginTop: "1rem", textAlign: "center", backgroundColor: "var(--bg-panel)" }}>
        <span style={{ color: "var(--accent)", fontWeight: "bold" }}>OrbitForge Intelligence is analyzing...</span>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="ai-insight-panel prompt" style={{ marginTop: "1rem" }}>
        <button onClick={handleGenerate} className="button primary" style={{ width: "100%", padding: "1rem", backgroundColor: "var(--accent)", border: "none", color: "#fff", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          ✨ {buttonLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="ai-insight-panel result" style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem", marginTop: "1rem", backgroundColor: "var(--bg-panel)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>✨ AI Insight: {role.replace(/_/g, " ")}</h3>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
          <span style={{ padding: "0.2rem 0.4rem", backgroundColor: "var(--bg-input)", borderRadius: "4px" }}>Provider: {insight.provider}</span>
          <span style={{ padding: "0.2rem 0.4rem", backgroundColor: "var(--bg-input)", borderRadius: "4px" }}>Model: {insight.model}</span>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
        <strong>Answer:</strong>
        <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>{insight.answer}</p>
      </div>

      <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "4px", borderLeft: "3px solid var(--accent)" }}>
        <strong style={{ color: "var(--accent)" }}>Reasoning Summary:</strong>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>{insight.reasoningSummary}</p>
      </div>

      <div style={{ padding: "1rem", backgroundColor: "rgba(255, 193, 7, 0.05)", borderRadius: "4px", borderLeft: "3px solid var(--status-warning)" }}>
        <strong style={{ color: "var(--status-warning)" }}>Scientific Caveats:</strong>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{insight.scientificCaveats}</p>
      </div>

      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        Generated at {new Date(insight.generatedAt).toLocaleString()} • References: {insight.contextReferences?.join(", ")}
      </div>
    </div>
  );
}
