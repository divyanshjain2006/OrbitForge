export default function ErrorState({ error, onRetry }) {
  let title = "Error";
  let msg = error?.message || "An unexpected error occurred.";
  
  if (error?.status === 404 || error?.code === "NOT_FOUND" || error?.code === "RESOURCE_NOT_FOUND") {
    title = "Not Found";
    msg = "The requested resource could not be found.";
  } else if (error?.status === 401 || error?.status === 403 || error?.code === "WORKSPACE_ACCESS_DENIED") {
    title = "Access Denied";
    msg = "You do not have permission to view this resource.";
  } else if (error?.code === "MALFORMED_RESPONSE" || error?.message === "Invalid response format") {
    title = "Invalid Data";
    msg = "The server returned data in an unexpected format.";
  } else if (error?.message === "Failed to fetch" || error?.message?.includes("NetworkError")) {
    title = "Network Error";
    msg = "Unable to reach the server. Please check your connection.";
  }

  return (
    <div className="error-state" style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--bg-panel)", border: "1px solid var(--status-danger)", borderRadius: "8px", margin: "1rem 0" }}>
      <h3 style={{ color: "var(--status-danger)", margin: "0 0 1rem 0" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", wordBreak: "break-word" }}>{msg}</p>
      {onRetry && (
        <button onClick={onRetry} className="action-button secondary" style={{ padding: "0.5rem 1rem", borderRadius: "4px" }}>Retry</button>
      )}
    </div>
  );
}
