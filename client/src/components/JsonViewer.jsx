import { useState } from "react";

export default function JsonViewer({ data, initiallyExpanded = false }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data === null || data === undefined) {
    return <div className="json-viewer empty">No data available</div>;
  }

  return (
    <div className="json-viewer" style={{ border: "1px solid var(--border)", borderRadius: "4px", backgroundColor: "var(--bg-panel)", overflow: "hidden" }}>
      <div className="json-viewer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-input)" }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
        >
          {expanded ? "▼" : "▶"} {expanded ? "Collapse JSON" : "Expand JSON"}
        </button>
        <button 
          onClick={handleCopy}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      
      {expanded && (
        <div className="json-viewer-content" style={{ padding: "1rem", overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
          <pre style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
