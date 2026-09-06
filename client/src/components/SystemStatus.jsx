function SystemStatus({ status, error }) {
  return (
    <section>
      <h2>System Status</h2>

      <p>
        Backend: <strong>{status}</strong>
      </p>

      {error && <p>Error: {error}</p>}
    </section>
  );
}

export default SystemStatus;