import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMissionById,
  createSimulation,
  getMissionSimulations,
  getSimulation,
  triggerSimulationEvent,
  submitSimulationDecision,
  publishSimulationToResearch
} from "../services/api";

import AiInsightPanel from "../components/ai/AiInsightPanel";
import OrbitVisualization from "../components/OrbitVisualization";
import SpaceWeatherPanel from "../components/SpaceWeatherPanel";
import "./Analysis.css"; // Reuse Analysis styles

export default function SimulationLab() {
  const { missionId } = useParams();
  const [mission, setMission] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Decision state
  const [decisionType, setDecisionType] = useState("MAINTAIN_ORBIT");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [altitudeDelta, setAltitudeDelta] = useState(0);

  // Publishing state
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const missionData = await getMissionById(missionId);
        setMission(missionData?.mission || missionData);
        
        const simsData = await getMissionSimulations(missionId);
        setSimulations(simsData?.simulations || []);
      } catch (err) {
        setError(err.message || "Failed to load simulation data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [missionId]);

  async function handleCreateSimulation() {
    try {
      setProcessing(true);
      const data = await createSimulation(missionId);
      setSimulations([data.simulation, ...simulations]);
      setActiveSimulation(data.simulation);
    } catch (err) {
      setError(err.message || "Failed to create simulation");
    } finally {
      setProcessing(false);
    }
  }

  async function loadSimulation(id) {
    try {
      setProcessing(true);
      const data = await getSimulation(id);
      setActiveSimulation(data.simulation);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleTriggerEvent() {
    if (!activeSimulation) return;
    try {
      setProcessing(true);
      const eventData = {
        type: "ENVIRONMENTAL_CHANGE",
        description: "Simulated orbital debris density increase detected.",
        parameters: { severity: "MODERATE" }
      };
      const data = await triggerSimulationEvent(activeSimulation._id, eventData);
      setActiveSimulation(data.simulation);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!activeSimulation) return;
    
    try {
      setProcessing(true);
      const decisionData = {
        type: decisionType,
        description: decisionDescription || `Elected to ${decisionType}`,
        parameters: decisionType === "ADJUST_ORBIT" ? { altitudeDeltaKm: Number(altitudeDelta) } : undefined
      };
      const data = await submitSimulationDecision(activeSimulation._id, decisionData);
      setActiveSimulation(data.simulation);
      setDecisionDescription("");
      setAltitudeDelta(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePublish() {
    if (!activeSimulation) return;
    try {
      setPublishing(true);
      setPublishMessage("");
      setPublishError("");
      const result = await publishSimulationToResearch(activeSimulation._id);
      setPublishMessage(`Successfully published! Research Record ID: ${result.researchRecord?._id}`);
    } catch (err) {
      setPublishError(err.message || "Failed to publish research record.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="analysis-layout">
        <div className="analysis-header">
          <div className="skeleton" style={{ width: "200px", height: "30px", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "300px", height: "20px" }} />
        </div>
      </div>
    );
  }

  const currentState = activeSimulation?.currentState;
  const lastEvent = activeSimulation?.timeline?.slice().reverse().find(e => e.type === "EVENT");

  return (
    <div className="analysis-layout">
      <header className="analysis-header">
        <div>
          <span className="section-kicker">PHASE 6: SIMULATION LAB</span>
          <h1>{mission?.name || "Mission"} - Simulation</h1>
          <p className="muted">Interactive scenario-based mission simulation.</p>
        </div>
        <div className="header-actions">
          <Link to={`/analysis/${missionId}`} className="button button-secondary">
            ← Back to Mission Lab
          </Link>
        </div>
      </header>

      {(publishMessage || publishError) && (
        <div style={{ marginBottom: "2rem" }}>
          {publishMessage && <div className="alert" role="alert" style={{ backgroundColor: "rgba(6, 182, 212, 0.1)", color: "var(--status-info)", border: "1px solid var(--status-info)" }}>{publishMessage}</div>}
          {publishError && <div className="alert" role="alert" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--status-error)", border: "1px solid var(--status-error)" }}>{publishError}</div>}
        </div>
      )}

      {error && <div className="alert" role="alert">{error}</div>}

      <div className="analysis-grid">
        <div className="analysis-main">
          {!activeSimulation ? (
            <section className="panel">
              <div className="panel-header">
                <h2>Simulations</h2>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <button onClick={handleCreateSimulation} disabled={processing} className="button button-primary">
                  Start New Simulation
                </button>
                <div style={{ marginTop: "2rem" }}>
                  {simulations.length === 0 ? (
                    <p className="muted">No simulations run for this mission yet.</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {simulations.map(sim => (
                        <li key={sim._id} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "4px" }}>
                          <div>
                            <strong>Simulation Started: {new Date(sim.createdAt).toLocaleString()}</strong>
                            <span style={{ float: "right" }} className={`risk-badge risk-${sim.status.toLowerCase()}`}>{sim.status}</span>
                          </div>
                          <p>Performance Score: {sim.performanceScore}/100 | Mission Day: {sim.currentMissionDay}</p>
                          <button onClick={() => loadSimulation(sim._id)} className="button button-secondary" style={{ marginTop: "0.5rem" }}>
                            Load Simulation
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="panel">
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <span className="section-kicker">ACTIVE SIMULATION</span>
                    <h2>Mission Day {activeSimulation.currentMissionDay}</h2>
                  </div>
                  <div>
                    <span className="risk-badge" style={{ backgroundColor: "var(--status-info)" }}>
                      Performance: {activeSimulation.performanceScore}/100
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "1rem" }}>
                   <div style={{ flex: 1 }}>
                     <h4 className="muted">Configuration</h4>
                     <p>Alt: {currentState?.configuration?.altitude} km | Inc: {currentState?.configuration?.inclination}°</p>
                   </div>
                   <div style={{ flex: 1 }}>
                     <h4 className="muted">Current Risk</h4>
                     <p>{currentState?.risk?.score} ({currentState?.risk?.level})</p>
                   </div>
                   <div style={{ flex: 1 }}>
                     <h4 className="muted">Current Env</h4>
                     <p>{currentState?.environment?.score} ({currentState?.environment?.level})</p>
                   </div>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <button onClick={handleTriggerEvent} disabled={processing || publishing} className="button button-secondary">
                    Trigger Random Event (+50 Days)
                  </button>
                  <button onClick={() => setActiveSimulation(null)} disabled={processing || publishing} className="button button-secondary" style={{ marginLeft: "1rem" }}>
                    Exit Simulation
                  </button>
                  <button onClick={handlePublish} disabled={processing || publishing} className="button button-secondary" style={{ marginLeft: "1rem", borderColor: "var(--status-info)", color: "var(--status-info)" }}>
                    {publishing ? "Publishing..." : "Publish to Research"}
                  </button>
                </div>
              </section>

              {lastEvent && (
                <section className="panel" style={{ borderLeft: "4px solid var(--status-warning)" }}>
                  <div className="panel-header">
                    <span className="section-kicker">NEW EVENT DETECTED</span>
                    <h3>{lastEvent.event?.type}</h3>
                    <p>{lastEvent.event?.description}</p>
                  </div>
                  
                  <div style={{ padding: "1.5rem" }}>
                    <h4>Submit a Decision</h4>
                    <form onSubmit={handleSubmitDecision} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <select value={decisionType} onChange={e => setDecisionType(e.target.value)} className="scenario-field" style={{ padding: "0.5rem" }}>
                        <option value="MAINTAIN_ORBIT">MAINTAIN ORBIT</option>
                        <option value="ADJUST_ORBIT">ADJUST ORBIT</option>
                        <option value="SAFE_MODE">ENTER SAFE MODE</option>
                        <option value="GATHER_MORE_DATA">GATHER MORE DATA</option>
                      </select>

                      {decisionType === "ADJUST_ORBIT" && (
                        <label className="scenario-field">
                          <span>Altitude Delta (km)</span>
                          <input type="number" value={altitudeDelta} onChange={e => setAltitudeDelta(e.target.value)} />
                        </label>
                      )}

                      <label className="scenario-field">
                        <span>Decision Reason</span>
                        <input type="text" value={decisionDescription} onChange={e => setDecisionDescription(e.target.value)} required placeholder="Provide a reason for the log..." />
                      </label>
                      
                      <button type="submit" disabled={processing} className="button button-primary" style={{ alignSelf: "flex-start" }}>
                        Submit Decision & Process Physics
                      </button>
                    </form>
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="panel-header">
                  <h2>Simulation Timeline</h2>
                </div>
                <div style={{ padding: "1.5rem" }}>
                  {activeSimulation.timeline.slice().reverse().map((entry, idx) => (
                    <div key={idx} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                      <div className="muted" style={{ marginBottom: "0.5rem" }}>Day {entry.missionDay} - {entry.type}</div>
                      {entry.type === "EVENT" && (
                        <div style={{ color: "var(--status-warning)" }}>
                          <strong>{entry.event?.type}:</strong> {entry.event?.description}
                        </div>
                      )}
                      {entry.type === "DECISION" && (
                        <div style={{ color: "var(--status-info)" }}>
                          <strong>{entry.decision?.type}:</strong> {entry.decision?.description}
                        </div>
                      )}
                      {entry.type === "INITIALIZATION" && (
                        <div>Simulation started with baseline configuration.</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <aside className="analysis-sidebar">
          {activeSimulation && currentState && (
            <OrbitVisualization altitude={currentState.configuration.altitude} inclination={currentState.configuration.inclination} />
          )}

          {activeSimulation && (
            <SpaceWeatherPanel />
          )}

          {activeSimulation && (
            <AiInsightPanel
              role="SCENARIO_ANALYST"
              contextRefs={{ simulationId: activeSimulation._id }}
              title="Scenario Analyst"
              description="AI evaluation of the current simulation state."
              refreshTrigger={activeSimulation.currentMissionDay}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
