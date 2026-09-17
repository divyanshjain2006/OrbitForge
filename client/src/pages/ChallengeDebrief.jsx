import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChallenge, getSimulation } from "../services/api";
import AiInsightPanel from "../components/ai/AiInsightPanel";
import "./Analysis.css";

export default function ChallengeDebrief() {
  const { missionId, challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const challengeData = await getChallenge(challengeId);
        setChallenge(challengeData.challenge);
        if (challengeData.challenge.simulationId) {
          // fetch simulation to get scientific data
          const simId = typeof challengeData.challenge.simulationId === 'object' ? challengeData.challenge.simulationId._id : challengeData.challenge.simulationId;
          const simData = await getSimulation(simId);
          setSimulation(simData.simulation);
        }
      } catch (err) {
        setError(err.message || "Failed to load debrief");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="analysis-layout">
        <div className="skeleton" style={{ width: "300px", height: "40px", margin: "2rem" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-layout">
        <div className="alert" role="alert">{error}</div>
      </div>
    );
  }

  const isCompleted = challenge?.status === "COMPLETED";

  return (
    <div className="analysis-layout">
      <header className="analysis-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
        <div>
          <span className="section-kicker">MISSION DEBRIEF</span>
          <h1>Challenge: {challenge.challengeType}</h1>
          <p className="muted">Final evaluation and operational outcome.</p>
        </div>
        <div className="header-actions">
          <Link to={`/challenges/${missionId}`} className="button button-secondary">
            Return to Challenges
          </Link>
          <Link to={`/analysis/${missionId}`} className="button button-primary">
            Mission Lab
          </Link>
        </div>
      </header>

      <div className="analysis-grid" style={{ marginTop: "2rem" }}>
        <div className="analysis-main">
          
          <section className="panel" style={{ marginBottom: "2rem" }}>
            <div className="panel-header">
              <h2>SCIENTIFIC RESULTS</h2>
              <p className="muted">Actual scientific outputs from the deterministic engine.</p>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", gap: "2rem" }}>
              <div style={{ flex: 1 }}>
                <span className="muted">Final Altitude</span>
                <h3>{simulation?.currentState?.configuration?.altitude} km</h3>
              </div>
              <div style={{ flex: 1 }}>
                <span className="muted">Final Risk Level</span>
                <h3>{simulation?.currentState?.risk?.level} ({simulation?.currentState?.risk?.score})</h3>
              </div>
              <div style={{ flex: 1 }}>
                <span className="muted">Final Environment</span>
                <h3>{simulation?.currentState?.environment?.level} ({simulation?.currentState?.environment?.score})</h3>
              </div>
            </div>
          </section>

          <section className="panel" style={{ marginBottom: "2rem" }}>
            <div className="panel-header">
              <h2>DECISION HISTORY</h2>
              <p className="muted">Actual player choices made during the challenge.</p>
            </div>
            <div style={{ padding: "1.5rem" }}>
              {challenge.playerDecisionHistory && challenge.playerDecisionHistory.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {challenge.playerDecisionHistory.map((d, i) => (
                    <li key={i} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                      <strong>Stage {d.stage}: {d.decision?.type}</strong>
                      <p className="muted">{d.decision?.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No decisions recorded.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>MISSION OUTCOME</h2>
              <p className="muted">Simulation outcome resulting from the event sequence.</p>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p>{isCompleted ? "Mission challenge successfully concluded and all events resolved." : `Challenge ended prematurely with status: ${challenge.status}`}</p>
              <div style={{ marginTop: "1rem" }}>
                <span className="muted">Total Mission Days Elapsed: </span>
                <strong>{simulation?.currentMissionDay || 0} days</strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="analysis-sidebar">
          <section className="panel" style={{ marginBottom: "2rem" }}>
            <div className="panel-header" style={{ backgroundColor: "var(--surface-sunken)" }}>
              <h2>MISSION PERFORMANCE</h2>
            </div>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: challenge.performanceScore > 70 ? "var(--status-info)" : "var(--status-warning)" }}>
                {challenge.performanceScore} / 100
              </div>
              <p className="muted" style={{ marginTop: "1rem" }}>
                This is a gameplay/operational score. It does not represent scientific certainty or physical probability.
              </p>
            </div>
          </section>

          <AiInsightPanel
            role="SCENARIO_ANALYST"
            contextRefs={{ simulationId: simulation?._id }}
            title="Scenario Analyst"
            description="AI debrief summary based on the recorded events and decisions."
            refreshTrigger={challenge.status}
          />
        </aside>
      </div>
    </div>
  );
}
