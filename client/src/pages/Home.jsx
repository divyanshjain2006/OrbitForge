import { useEffect, useState } from "react";

import SystemStatus from "../components/SystemStatus";
import { getHealthStatus } from "../services/api";

function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getHealthStatus();

        setBackendStatus(data.message);
        setError("");
      } catch (err) {
        console.error(err);

        setBackendStatus("Backend unavailable");
        setError(err.message);
      }
    }

    checkBackend();
  }, []);

  return (
    <main>
      <h1>OrbitForge</h1>

      <p>LEO Mission Decision Intelligence Platform</p>

      <SystemStatus
        status={backendStatus}
        error={error}
      />
    </main>
  );
}

export default Home;