import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getMissionById,
  getMissionAnalysis,
  getMissionIntelligence,
  getMissionAssessmentHistory
} from "../services/api";

import ScenarioSimulator from "../components/ScenarioSimulator";
import OrbitVisualization from "../components/OrbitVisualization";

import "./Analysis.css";

function Analysis() {
  const { missionId } = useParams();

  const [mission, setMission] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [assessmentHistory, setAssessmentHistory] =
    useState([]);

  const [loading, setLoading] = useState(
    Boolean(missionId)
  );

  const [error, setError] = useState("");

  /*
   * =========================================================
   * ASSESSMENT HISTORY REFRESH
   * =========================================================
   *
   * Called after ScenarioSimulator completes a simulation.
   *
   * This allows the timeline to immediately show the newly
   * created SCENARIO_SIMULATION assessment.
   */

  async function refreshAssessmentHistory() {
    if (!missionId) {
      return;
    }

    try {
      const historyData =
        await getMissionAssessmentHistory(
          missionId
        );

      setAssessmentHistory(
        historyData?.assessments || []
      );
    } catch (requestError) {
      console.error(
        "Failed to refresh assessment history:",
        requestError
      );
    }
  }

  /*
   * =========================================================
   * LOAD MISSION ANALYSIS
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!missionId) {
        setLoading(false);
        setError("Mission ID is missing.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          missionData,
          analysisData,
          intelligenceData,
          historyData
        ] = await Promise.all([
          getMissionById(missionId),
          getMissionAnalysis(missionId),
          getMissionIntelligence(missionId),
          getMissionAssessmentHistory(missionId)
        ]);

        if (cancelled) {
          return;
        }

        setMission(
          missionData?.mission ||
            missionData ||
            null
        );

        setAnalysis(
          analysisData?.analysis ||
            null
        );

        setIntelligence(
          intelligenceData?.intelligence ||
            null
        );

        setAssessmentHistory(
          historyData?.assessments ||
            []
        );
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load mission analysis:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to load mission analysis."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [missionId]);

  /*
   * =========================================================
   * NO MISSION
   * =========================================================
   */

  if (!missionId) {
    return (
      <main>
        <section className="panel empty-state">
          <p className="page-eyebrow">
            MISSION ANALYSIS
          </p>

          <h1>No Mission Selected</h1>

          <p>
            Select a mission from the dashboard to begin
            orbital analysis.
          </p>

          <Link
            to="/"
            className="button button-primary"
          >
            Return to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main>
        <section className="panel analysis-loading">
          <div className="loading-indicator">
            ANALYZING MISSION
          </div>

          <h1>
            Calculating Mission Intelligence
          </h1>

          <p>
            Processing orbital mechanics, risk
            factors, environmental exposure and
            operational readiness.
          </p>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error) {
    return (
      <main>
        <section className="panel">
          <p className="page-eyebrow">
            ANALYSIS ERROR
          </p>

          <h1>Analysis Unavailable</h1>

          <div
            className="alert"
            role="alert"
          >
            {error}
          </div>

          <Link
            to="/"
            className="button button-secondary"
          >
            Return to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * REQUIRED DATA CHECK
   * =========================================================
   */

  if (!mission || !analysis || !intelligence) {
    return (
      <main>
        <section className="panel empty-state">
          <h1>
            Analysis Data Unavailable
          </h1>

          <p>
            OrbitGuard could not obtain the required
            mission intelligence.
          </p>

          <Link
            to="/"
            className="button button-primary"
          >
            Return to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * SAFE DATA EXTRACTION
   * =========================================================
   */

  const risk =
    analysis?.risk || {};

  const activeFactors =
    risk?.activeFactors || [];

  const riskLevel =
    String(
      risk?.level || "LOW"
    ).toLowerCase();

  const missionName =
    mission?.name ||
    analysis?.mission?.name ||
    intelligence?.mission?.name ||
    "Mission";

  const primaryConcern =
    intelligence?.primaryConcern || {
      title:
        "No dominant risk identified",

      explanation:
        "No significant concern was identified by the current model.",

      severity: "LOW"
    };

  const readiness =
    intelligence?.readiness || {};

  const environment =
    intelligence?.environment ||
    null;

  const environmentScore =
    Number(
      environment?.score
    ) || 0;

  const environmentLevel =
    String(
      environment?.level || "LOW"
    ).toLowerCase();

  const environmentPosture =
    environment?.posture?.label ||
    "Baseline environment";

  const environmentFactors =
    environment?.activeFactors || [];

  const environmentMethodology =
    environment?.methodology || null;

  const priority =
    String(
      intelligence?.priority || "LOW"
    ).toUpperCase();

  const actions =
    intelligence?.actions || [];

  const methodology =
    risk?.methodology ||
    intelligence?.methodology ||
    {};

  const orbitalInputs =
    analysis?.inputs || {};

  const altitude =
    orbitalInputs?.altitudeKm ??
    mission?.altitude ??
    "—";

  const inclination =
    orbitalInputs?.inclinationDeg ??
    mission?.inclination ??
    "—";

  const duration =
    orbitalInputs?.durationDays ??
    mission?.duration ??
    "—";

  const orbitalRadius =
    analysis?.orbitalRadiusKm ??
    "—";

  const orbitalVelocity =
    analysis?.orbitalVelocityKmPerSecond ??
    "—";

  const orbitalPeriod =
    analysis?.orbitalPeriodMinutes ??
    "—";

  const revolutionsPerDay =
    analysis?.revolutionsPerDay ??
    "—";

  const estimatedRevolutions =
    analysis?.estimatedRevolutions ??
    0;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main className="analysis-page">

      {/* =====================================================
          PAGE HERO
          ===================================================== */}

      <section className="analysis-header">
        <div>
          <p className="page-eyebrow">
            MISSION INTELLIGENCE
          </p>

          <h1>
            {missionName}
          </h1>

          <p className="page-subtitle">
            Orbital analysis and operational
            decision support for this mission.
          </p>
        </div>

        <Link
          to="/"
          className="button button-secondary"
        >
          ← Dashboard
        </Link>
      </section>

      {/* =====================================================
          INTELLIGENCE HERO
          ===================================================== */}

      <section className="intelligence-panel">
        <div className="intelligence-header">
          <div>
            <span className="section-kicker">
              DECISION-SUPPORT ASSESSMENT
            </span>

            <h2>
              Mission Intelligence
            </h2>
          </div>

          <span
            className={`priority-badge ${priority.toLowerCase()}`}
          >
            {priority} PRIORITY
          </span>
        </div>

        <p className="intelligence-summary">
          {intelligence?.summary ||
            "Mission intelligence is available for the current configuration."}
        </p>

        {intelligence?.decisionExplanation && (
          <div className="decision-explanation">
            <span className="metric-label">
              DECISION EXPLANATION
            </span>

            <p>
              {
                intelligence.decisionExplanation
              }
            </p>
          </div>
        )}

        <div className="intelligence-grid">

          <article className="intelligence-card">
            <span className="metric-label">
              MISSION READINESS
            </span>

            <strong className="intelligence-card-title">
              {readiness?.label ||
                "Baseline configuration"}
            </strong>

            <p>
              {readiness?.explanation ||
                "No additional readiness information is available."}
            </p>
          </article>

          <article className="intelligence-card">
            <span className="metric-label">
              PRIMARY CONCERN
            </span>

            <strong className="intelligence-card-title">
              {primaryConcern.title}
            </strong>

            <p>
              {primaryConcern.explanation}
            </p>

            {primaryConcern.severity && (
              <span
                className={`severity-badge ${String(
                  primaryConcern.severity
                ).toLowerCase()}`}
              >
                {primaryConcern.severity}
              </span>
            )}
          </article>

        </div>

        {intelligence?.operationalPosture && (
          <div className="operational-posture">
            <div>
              <span className="metric-label">
                MODEL POSTURE
              </span>

              <strong>
                {
                  intelligence
                    .operationalPosture
                    .label
                }
              </strong>
            </div>

            {intelligence?.ruleCoverage && (
              <span className="rule-coverage-badge">
                {intelligence.ruleCoverage}{" "}
                RULE COVERAGE
              </span>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          DECISION SNAPSHOT
          ===================================================== */}

      <section className="analysis-risk-grid">

        <article className="risk-score-card">
          <span className="metric-label">
            MISSION RISK
          </span>

          <div className="risk-score">
            {risk?.score ?? 0}
            <span>/100</span>
          </div>

          <span
            className={`risk-badge ${riskLevel}`}
          >
            {risk?.level || "LOW"} RISK
          </span>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            ACTIVE RISK FACTORS
          </span>

          <strong className="large-number">
            {activeFactors.length}
          </strong>

          <p>
            Factors currently contributing
            to the mission risk assessment.
          </p>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            ENVIRONMENT SCORE
          </span>

          <strong className="large-number">
            {environmentScore}
          </strong>

          <p>
            Modeled environmental exposure
            from altitude and inclination.
          </p>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            ASSESSMENT PRIORITY
          </span>

          <strong className="large-number">
            {priority}
          </strong>

          <p>
            Operational attention level
            generated by mission intelligence.
          </p>
        </article>

      </section>

      {/* =====================================================
          ORBITAL CONFIGURATION
          ===================================================== */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              ORBITAL CONFIGURATION
            </span>

            <h2>
              Mission Parameters
            </h2>

            <p className="muted">
              Current configuration used by the
              OrbitGuard analysis engine.
            </p>
          </div>
        </div>

        <div className="mission-metrics">

          <div className="metric">
            <span className="metric-label">
              ALTITUDE
            </span>

            <span className="metric-value">
              {altitude} km
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">
              INCLINATION
            </span>

            <span className="metric-value">
              {inclination}°
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">
              DURATION
            </span>

            <span className="metric-value">
              {duration} days
            </span>
          </div>

        </div>
      </section>

      {/* =====================================================
          ORBIT VISUALIZATION
          ===================================================== */}

      <OrbitVisualization
        altitude={
          Number(altitude) || 0
        }
        inclination={
          Number(inclination) || 0
        }
        velocity={
          Number(
            orbitalVelocity
          ) || 0
        }
        period={
          Number(
            orbitalPeriod
          ) || 0
        }
        revolutionsPerDay={
          Number(
            revolutionsPerDay
          ) || 0
        }
      />

      {/* =====================================================
          ORBITAL MECHANICS
          ===================================================== */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              ORBITAL MECHANICS
            </span>

            <h2>
              Orbital Characteristics
            </h2>
          </div>
        </div>

        <div className="characteristics-grid">

          <article className="characteristic">
            <span>
              ORBITAL RADIUS
            </span>

            <strong>
              {orbitalRadius} km
            </strong>
          </article>

          <article className="characteristic">
            <span>
              ORBITAL VELOCITY
            </span>

            <strong>
              {orbitalVelocity} km/s
            </strong>
          </article>

          <article className="characteristic">
            <span>
              ORBITAL PERIOD
            </span>

            <strong>
              {orbitalPeriod} min
            </strong>
          </article>

          <article className="characteristic">
            <span>
              REVOLUTIONS / DAY
            </span>

            <strong>
              {revolutionsPerDay}
            </strong>
          </article>

          <article className="characteristic">
            <span>
              ESTIMATED REVOLUTIONS
            </span>

            <strong>
              {Number(
                estimatedRevolutions
              ).toLocaleString()}
            </strong>
          </article>

        </div>
      </section>

      {/* =====================================================
          RISK FACTORS
          ===================================================== */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              RISK ASSESSMENT
            </span>

            <h2>
              Active Risk Factors
            </h2>
          </div>

          <span className="muted">
            {activeFactors.length} active
          </span>
        </div>

        {activeFactors.length === 0 ? (
          <div className="empty-state compact">
            <h3>
              No Additional Risk Factors
            </h3>

            <p>
              No additional operational risk
              factors were identified by the
              current rule set.
            </p>
          </div>
        ) : (
          <div className="risk-factor-list">

            {activeFactors.map(
              (factor, index) => (
                <article
                  className="risk-factor"
                  key={`${factor.category}-${factor.title}-${index}`}
                >
                  <div className="risk-factor-top">
                    <div>
                      <span className="metric-label">
                        {factor.category}
                      </span>

                      <h3>
                        {factor.title}
                      </h3>
                    </div>

                    <span
                      className={`severity-badge ${
                        factor.severity?.toLowerCase() ||
                        "low"
                      }`}
                    >
                      {factor.severity ||
                        "LOW"}
                    </span>
                  </div>

                  <p>
                    {factor.explanation}
                  </p>

                  {factor.signal && (
                    <span className="risk-signal">
                      SIGNAL: {factor.signal}
                    </span>
                  )}

                  {factor.recommendation && (
                    <p className="risk-recommendation">
                      <strong>
                        Recommendation:
                      </strong>{" "}
                      {factor.recommendation}
                    </p>
                  )}

                  <div className="risk-contribution">
                    <span>
                      Risk contribution
                    </span>

                    <strong>
                      +{factor.score} points
                    </strong>
                  </div>
                </article>
              )
            )}

          </div>
        )}
      </section>

      {/* =====================================================
          RECOMMENDED ACTIONS
          ===================================================== */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              DECISION SUPPORT
            </span>

            <h2>
              Recommended Actions
            </h2>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="empty-state compact">
            <h3>
              No Additional Actions
            </h3>

            <p>
              Continue baseline mission
              monitoring.
            </p>
          </div>
        ) : (
          <div className="action-list">

            {actions.map(
              (action, index) => (
                <article
                  className="action-card"
                  key={`${action.title}-${index}`}
                >
                  <div className="action-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="action-content">

                    <div className="action-heading">
                      <h3>
                        {action.title}
                      </h3>

                      <span
                        className={`action-priority ${
                          action.priority?.toLowerCase() ||
                          "medium"
                        }`}
                      >
                        {action.priority ||
                          "MEDIUM"}
                      </span>
                    </div>

                    <p>
                      {action.reason}
                    </p>

                  </div>
                </article>
              )
            )}

          </div>
        )}
      </section>

      {/* =====================================================
          SPACE ENVIRONMENT
          ===================================================== */}

      <section className="panel environment-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              SPACE ENVIRONMENT
            </span>

            <h2>
              Environmental Exposure
            </h2>

            <p className="muted">
              Modeled environmental conditions
              based on the current orbital
              configuration.
            </p>
          </div>

          <span
            className={`risk-badge ${environmentLevel}`}
          >
            {environment?.level ||
              "LOW"}
          </span>
        </div>

        <div className="environment-overview">

          <div className="environment-score-card">
            <span className="metric-label">
              ENVIRONMENT SCORE
            </span>

            <strong>
              {environmentScore}
              <small>/100</small>
            </strong>

            <span className="muted">
              {environmentPosture}
            </span>
          </div>

          <div className="environment-factor-grid">

            {environmentFactors.length === 0 ? (
              <div className="environment-clear">
                <span className="metric-label">
                  STATUS
                </span>

                <h3>
                  Baseline environmental
                  exposure
                </h3>

                <p>
                  No elevated environmental
                  factors were identified for
                  the current orbital
                  configuration.
                </p>
              </div>
            ) : (
              environmentFactors.map(
                (factor, index) => (
                  <article
                    className="environment-factor"
                    key={`${factor.category}-${index}`}
                  >
                    <div className="environment-factor-header">

                      <div>
                        <span className="metric-label">
                          {factor.category}
                        </span>

                        <h3>
                          {factor.title}
                        </h3>
                      </div>

                      <span
                        className={`severity-badge ${
                          factor.level?.toLowerCase() ||
                          "low"
                        }`}
                      >
                        {factor.level ||
                          "LOW"}
                      </span>

                    </div>

                    <p>
                      {factor.explanation}
                    </p>

                    {factor.signal && (
                      <span className="risk-signal">
                        SIGNAL:{" "}
                        {factor.signal}
                      </span>
                    )}

                    <div className="risk-contribution">
                      <span>
                        Environmental
                        contribution
                      </span>

                      <strong>
                        +{factor.score} points
                      </strong>
                    </div>
                  </article>
                )
              )
            )}

          </div>
        </div>

        {environmentMethodology?.description && (
          <div className="environment-methodology">
            <span className="metric-label">
              MODEL NOTE
            </span>

            <p>
              {
                environmentMethodology.description
              }
            </p>

            {environmentMethodology.version && (
              <span className="methodology-version">
                Environment model{" "}
                {
                  environmentMethodology.version
                }
              </span>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          SCENARIO SIMULATOR
          ===================================================== */}

      <ScenarioSimulator
        missionId={missionId}
        currentConfiguration={{
          altitude:
            Number(altitude) || 550,
          inclination:
            Number(inclination) || 51.6,
          duration:
            Number(duration) || 365
        }}
        currentRisk={risk}
        onSimulationComplete={
          refreshAssessmentHistory
        }
      />

      {/* =====================================================
          ASSESSMENT HISTORY
          ===================================================== */}

      <section className="panel assessment-history-panel">

        <div className="panel-header">

          <div>
            <span className="section-kicker">
              DECISION HISTORY
            </span>

            <h2>
              Assessment Timeline
            </h2>

            <p className="muted">
              Recorded mission assessments and
              scenario decisions for this
              mission.
            </p>
          </div>

          <span className="history-count">
            {assessmentHistory.length}{" "}
            {assessmentHistory.length === 1
              ? "assessment"
              : "assessments"}
          </span>

        </div>

        {assessmentHistory.length === 0 ? (
          <div className="empty-state">

            <h3>
              No assessment history
            </h3>

            <p>
              Assessment records will appear
              here after mission analysis and
              scenario simulations.
            </p>

          </div>
        ) : (
          <div className="assessment-timeline">

            {assessmentHistory.map(
              (assessment, index) => {

                const historyRiskLevel =
                  String(
                    assessment?.risk?.level ||
                      "LOW"
                  ).toLowerCase();

                let typeLabel =
                  "Risk Reassessment";

                if (
                  assessment?.type ===
                  "INITIAL_ASSESSMENT"
                ) {
                  typeLabel =
                    "Initial Assessment";
                }

                if (
                  assessment?.type ===
                  "SCENARIO_SIMULATION"
                ) {
                  typeLabel =
                    "Scenario Simulation";
                }

                const date =
                  assessment?.createdAt
                    ? new Date(
                        assessment.createdAt
                      ).toLocaleString()
                    : "Unknown time";

                const decision =
                  assessment?.decision ||
                  "Assessment recorded";

                const configuration =
                  assessment?.configuration ||
                  {};

                return (
                  <article
                    className="assessment-history-card"
                    key={
                      assessment?._id ||
                      `${assessment?.type}-${index}`
                    }
                  >

                    <div className="assessment-history-marker">
                      <span />
                    </div>

                    <div className="assessment-history-content">

                      <div className="assessment-history-top">

                        <div>
                          <span className="section-kicker">
                            {typeLabel}
                          </span>

                          <h3>
                            {decision}
                          </h3>
                        </div>

                        <span
                          className={`risk-badge ${historyRiskLevel}`}
                        >
                          {assessment?.risk?.level ||
                            "LOW"}{" "}
                          RISK
                        </span>

                      </div>

                      <div className="assessment-history-metrics">

                        <div>
                          <span className="metric-label">
                            RISK SCORE
                          </span>

                          <strong>
                            {assessment?.risk?.score ??
                              0}
                            <small>
                              /100
                            </small>
                          </strong>
                        </div>

                        <div>
                          <span className="metric-label">
                            ENVIRONMENT
                          </span>

                          <strong>
                            {assessment
                              ?.environment
                              ?.score ??
                              0}
                          </strong>

                          <span>
                            {assessment
                              ?.environment
                              ?.level ||
                              "LOW"}
                          </span>
                        </div>

                        <div>
                          <span className="metric-label">
                            ALTITUDE
                          </span>

                          <strong>
                            {configuration?.altitude ??
                              "—"}{" "}
                            km
                          </strong>
                        </div>

                        <div>
                          <span className="metric-label">
                            INCLINATION
                          </span>

                          <strong>
                            {configuration?.inclination ??
                              "—"}°
                          </strong>
                        </div>

                      </div>

                      {assessment?.summary && (
                        <p className="assessment-history-summary">
                          {assessment.summary}
                        </p>
                      )}

                      <span className="assessment-history-date">
                        {date}
                      </span>

                    </div>
                  </article>
                );
              }
            )}

          </div>
        )}
      </section>

      {/* =====================================================
          METHODOLOGY
          ===================================================== */}

      <section className="panel methodology-panel">

        <span className="metric-label">
          ASSESSMENT METHODOLOGY
        </span>

        <p>
          {methodology?.description ||
            "OrbitGuard uses an explainable deterministic mission-risk assessment model."}
        </p>

        {methodology?.version && (
          <span className="methodology-version">
            Engine version{" "}
            {methodology.version}
          </span>
        )}

      </section>

    </main>
  );
}

export default Analysis;
