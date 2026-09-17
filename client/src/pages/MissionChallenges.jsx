import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getMissionById,
  getChallengeCatalog,
  getMissionChallenges,
  createChallenge,
  getChallenge,
  startChallenge,
  submitChallengeDecision
} from "../services/api";
import AiInsightPanel from "../components/ai/AiInsightPanel";
import OrbitVisualization from "../components/OrbitVisualization";
import "./Analysis.css";

export default function MissionChallenges() {
  const { missionId, challengeId } = useParams();
  const navigate = useNavigate();

  const [mission, setMission] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Decision state
  const [decisionType, setDecisionType] = useState("");
  const [decisionDescription, setDecisionDescription] = useState("");
  const [altitudeDelta, setAltitudeDelta] = useState(0);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [missionData, catalogData, challengesData] = await Promise.all([
          getMissionById(missionId),
          getChallengeCatalog(),
          getMissionChallenges(missionId)
        ]);
        
        setMission(missionData?.mission || missionData);
        setCatalog(catalogData.catalog || []);
        setChallenges(challengesData.challenges || []);

        if (challengeId) {
          const cData = await getChallenge(challengeId);
          setActiveChallenge(cData.challenge);
        }
      } catch (err) {
        setError(err.message || "Failed to load challenges");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [missionId, challengeId]);

  async function handleCreateChallenge(type) {
    try {
      setProcessing(true);
      const data = await createChallenge(missionId, type);
      setChallenges([data.challenge, ...challenges]);
      navigate(`/challenges/${missionId}/${data.challenge._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleStartChallenge() {
    if (!activeChallenge) return;
    try {
      setProcessing(true);
      const data = await startChallenge(activeChallenge._id);
      setActiveChallenge(data.challenge);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!activeChallenge) return;
    try {
      setProcessing(true);
      const decisionData = {
        type: decisionType,
        description: decisionDescription || `Player selected ${decisionType}`,
        parameters: decisionType === "ADJUST_ORBIT" ? { altitudeDeltaKm: Number(altitudeDelta) } : undefined
      };
      const data = await submitChallengeDecision(activeChallenge._id, decisionData);
      setActiveChallenge(data.challenge);
      setDecisionType("");
      setDecisionDescription("");
      
      if (data.challenge.status === "COMPLETED" || data.challenge.status === "FAILED") {
        navigate(`/challenges/${missionId}/${data.challenge._id}/debrief`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="analysis-layout"><div className="skeleton" style={{ width: "200px", height: "30px", margin: "2rem" }} /></div>;
  }

  // --- SELECTION VIEW ---
  if (!challengeId || !activeChallenge) {
    return (
      <div className="analysis-layout">
        <header className="analysis-header">
          <div>
            <span className="section-kicker">PHASE 7: MISSION CHALLENGES</span>
            <h1>{mission?.name} - Challenges</h1>
            <p className="muted">Select a simulated challenge scenario to test operational readiness.</p>
          </div>
          <div className="header-actions">
            <Link to={`/analysis/${missionId}`} className="button button-secondary">← Mission Lab</Link>
          </div>
        </header>
        {error && <div className="alert" role="alert">{error}</div>}
        <div className="analysis-grid">
          <div className="analysis-main">
            <section className="panel">
              <div className="panel-header"><h2>Challenge Catalog</h2></div>
              <div style={{ padding: "1.5rem" }}>
                {catalog.map(c => (
                  <div key={c.type} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "4px" }}>
                    <h3>{c.title}</h3>
                    <p className="muted">{c.description}</p>
                    <p style={{ marginTop: "0.5rem" }}><strong>Objective:</strong> {c.objective}</p>
                    <button onClick={() => handleCreateChallenge(c.type)} disabled={processing} className="button button-primary" style={{ marginTop: "1rem" }}>
                      Create Challenge
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="analysis-sidebar">
            <section className="panel">
              <div className="panel-header"><h2>Your Active Challenges</h2></div>
              <div style={{ padding: "1rem" }}>
                {challenges.length === 0 ? <p className="muted">No challenges started.</p> : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {challenges.map(c => (
                      <li key={c._id} style={{ marginBottom: "1rem" }}>
                        <Link to={`/challenges/${missionId}/${c._id}`}>
                          {c.challengeType} ({c.status})
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  // --- ACTIVE CHALLENGE VIEW ---
  const simulationState = activeChallenge.simulationId?.currentState || activeChallenge.simulationId?.initialState;
  const currentTimeline = activeChallenge.simulationId?.timeline || [];
  const lastEvent = currentTimeline.slice().reverse().find(e => e.type === "EVENT");

  // Determine available decisions from catalog definition based on stage
  const catalogDef = catalog.find(c => c.type === activeChallenge.challengeType);
  const stageDef = catalogDef?.stages[activeChallenge.currentStage];
  const availableDecisions = stageDef?.availableDecisions || [];

  return (
    <div className="analysis-layout">
      <header className="analysis-header">
        <div>
          <span className="section-kicker">CHALLENGE: {activeChallenge.status}</span>
          <h1>{catalogDef?.title || activeChallenge.challengeType}</h1>
        </div>
        <div className="header-actions">
          {activeChallenge.status === "COMPLETED" && (
            <Link to={`/challenges/${missionId}/${activeChallenge._id}/debrief`} className="button button-primary">
              View Final Debrief
            </Link>
          )}
          <Link to={`/challenges/${missionId}`} className="button button-secondary">Exit Challenge</Link>
        </div>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      <div className="analysis-grid">
        <div className="analysis-main">
          
          {activeChallenge.status === "NOT_STARTED" && (
            <section className="panel">
              <div className="panel-header"><h2>Challenge Briefing</h2></div>
              <div style={{ padding: "1.5rem" }}>
                <p><strong>Objective:</strong> {catalogDef?.objective}</p>
                <div style={{ padding: "1rem", backgroundColor: "var(--surface-sunken)", marginTop: "1rem", borderRadius: "4px" }}>
                  <h4 className="muted">Scientific Constraints</h4>
                  <p>All consequences are strictly derived from OrbitForge's scientific engine. Your gameplay performance score is separate from scientific truth.</p>
                </div>
                <button onClick={handleStartChallenge} disabled={processing} className="button button-primary" style={{ marginTop: "2rem" }}>
                  Start Challenge Sequence
                </button>
              </div>
            </section>
          )}

          {activeChallenge.status === "DECISION_REQUIRED" && lastEvent && (
            <section className="panel" style={{ borderLeft: "4px solid var(--status-warning)" }}>
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span className="section-kicker">EVENT {activeChallenge.currentStage + 1}</span>
                  <h3>{lastEvent.event?.type}</h3>
                  <p>{lastEvent.event?.description}</p>
                </div>
                <div>
                  <span className="risk-badge" style={{ backgroundColor: "var(--status-info)" }}>
                    Performance: {activeChallenge.performanceScore}/100
                  </span>
                </div>
              </div>
              
              <div style={{ padding: "1.5rem" }}>
                <h4>Select Action</h4>
                <form onSubmit={handleSubmitDecision} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <select value={decisionType} onChange={e => setDecisionType(e.target.value)} required className="scenario-field" style={{ padding: "0.5rem" }}>
                    <option value="" disabled>-- Select a valid decision --</option>
                    {availableDecisions.map(d => (
                      <option key={d} value={d}>{d.replace("_", " ")}</option>
                    ))}
                  </select>

                  {decisionType === "ADJUST_ORBIT" && (
                    <label className="scenario-field">
                      <span>Altitude Delta (km)</span>
                      <input type="number" value={altitudeDelta} onChange={e => setAltitudeDelta(e.target.value)} />
                    </label>
                  )}
                  
                  <label className="scenario-field">
                    <span>Decision Rationale</span>
                    <input type="text" value={decisionDescription} onChange={e => setDecisionDescription(e.target.value)} required placeholder="Provide reason..." />
                  </label>
                  
                  <button type="submit" disabled={processing || !decisionType} className="button button-primary" style={{ alignSelf: "flex-start" }}>
                    Submit Decision
                  </button>
                </form>
              </div>
            </section>
          )}

          {(activeChallenge.status === "ACTIVE" || activeChallenge.status === "DECISION_REQUIRED" || activeChallenge.status === "COMPLETED") && (
            <section className="panel">
              <div className="panel-header"><h2>Scientific State (Simulation Sandbox)</h2></div>
              <div style={{ padding: "1.5rem", display: "flex", gap: "1rem" }}>
                 <div style={{ flex: 1 }}>
                   <h4 className="muted">Configuration</h4>
                   <p>Alt: {simulationState?.configuration?.altitude} km</p>
                 </div>
                 <div style={{ flex: 1 }}>
                   <h4 className="muted">Risk</h4>
                   <p>{simulationState?.risk?.score} ({simulationState?.risk?.level})</p>
                 </div>
                 <div style={{ flex: 1 }}>
                   <h4 className="muted">Environment</h4>
                   <p>{simulationState?.environment?.score} ({simulationState?.environment?.level})</p>
                 </div>
              </div>
            </section>
          )}
        </div>

        <aside className="analysis-sidebar">
          {simulationState && (
            <OrbitVisualization altitude={simulationState.configuration.altitude} inclination={simulationState.configuration.inclination} />
          )}

          {activeChallenge.status !== "NOT_STARTED" && (
            <AiInsightPanel
              role="SCENARIO_ANALYST"
              contextRefs={{ simulationId: activeChallenge.simulationId?._id }}
              title="Scenario Analyst"
              description="AI evaluation of current events."
              refreshTrigger={activeChallenge.currentStage}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
