import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getMissionById,
  getMissionAnalysis,
  getMissionIntelligence,
  getMissionAssessmentHistory,
  getMissionDecisions,
  createMissionDecision,
  applyApprovedScenario
} from "../services/api";

import ScenarioSimulator from "../components/ScenarioSimulator";
import OrbitVisualization from "../components/OrbitVisualization";

import "./Analysis.css";
import "../components/trust/trust.css";

import {
  ResearchRecordPanel,
  ProvenanceChain
} from "../components/trust";

function getApprovedScenario(
  mission,
  assessments
) {
  const scenarioId = mission?.decision?.scenarioId;

  if (
    mission?.decision?.status !==
      "SCENARIO_APPROVED" ||
    !scenarioId
  ) {
    return null;
  }

  const assessment = assessments.find(
    (candidate) =>
      String(candidate?._id || "") ===
      String(scenarioId)
  );

  if (!assessment) {
    return null;
  }

  return {
    assessmentId: assessment._id,
    configuration: assessment.configuration,
    risk: assessment.risk,
    environment: assessment.environment
  };
}

function Analysis() {
  const { missionId } = useParams();

  const [mission, setMission] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [assessmentHistory, setAssessmentHistory] =
    useState([]);
  const [decisions, setDecisions] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [applyingScenario, setApplyingScenario] =useState(false);
  const [applyScenarioMessage, setApplyScenarioMessage] =useState("");

  const [applyScenarioError, setApplyScenarioError] =useState("");
  const [decisionChoice, setDecisionChoice] =
    useState("");

  const [decisionReason, setDecisionReason] =
    useState("");

  const [decisionSubmitting, setDecisionSubmitting] =
    useState(false);
  const [approvedScenario, setApprovedScenario] =
    useState(null);

  const activeApprovedScenario =
    getApprovedScenario(
      mission,
      assessmentHistory
    ) || approvedScenario;
  const [decisionMessage, setDecisionMessage] =
    useState("");

  const [decisionError, setDecisionError] =
    useState("");

  const [loading, setLoading] = useState(
    Boolean(missionId)
  );

  const [error, setError] = useState("");
  const decisionRisk =
    selectedScenario?.risk ||
    analysis?.risk ||
    null;

  const decisionEnvironment =
    selectedScenario?.environment ||
    intelligence?.environment ||
    null;

  const decisionEnvironmentScore =
    Number(decisionEnvironment?.score) || 0;

  const decisionSnapshotLabel =
    selectedScenario
      ? "SCENARIO RISK"
      : "CURRENT RISK";

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
  async function handleScenarioSimulationComplete(
    simulationData
  ) {
    await refreshAssessmentHistory();

    if (!simulationData?.assessmentId) {
      return;
    }
  }

  function handleScenarioSelect(scenario) {
    setSelectedScenario(scenario);

    setDecisionChoice("");
    setDecisionReason("");
    setDecisionError("");

    setDecisionMessage(
      scenario
        ? "Scenario selected. Review the comparison, then record a decision using this assessment snapshot."
        : "Scenario selection cleared. Decisions will apply to the current configuration."
    );
  }
  async function handleApplyApprovedScenario() {
    if (
      !missionId ||
      !activeApprovedScenario?.assessmentId
    ) {
      return;
    }

    try {
      setApplyingScenario(true);
      setApplyScenarioError("");
      setApplyScenarioMessage("");

      const data =
        await applyApprovedScenario(
          missionId,
          activeApprovedScenario.assessmentId
        );

      if (data?.mission) {
        setMission(data.mission);
      }

      /*
       * Clear the old selected scenario because it has
       * now been applied to the mission configuration.
       */
      setSelectedScenario(null);
      setApprovedScenario(null);

      setDecisionChoice("");
      setDecisionReason("");

      /*
       * Refresh all analytical data so the UI reflects
       * the new mission configuration immediately.
       */
      const [
        missionData,
        analysisData,
        intelligenceData,
        historyData,
        decisionsData
      ] = await Promise.all([
        getMissionById(missionId),
        getMissionAnalysis(missionId),
        getMissionIntelligence(missionId),
        getMissionAssessmentHistory(missionId),
        getMissionDecisions(missionId)
      ]);

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

      setDecisions(
        decisionsData?.decisions ||
          []
      );

      setApplyScenarioMessage(
        "Approved scenario applied successfully. Mission analysis has been refreshed and returned to pending review."
      );
    } catch (requestError) {
      console.error(
        "Failed to apply approved scenario:",
        requestError
      );

      setApplyScenarioError(
        requestError.message ||
          "Unable to apply approved scenario."
      );
    } finally {
      setApplyingScenario(false);
    }
  }
  async function handleMissionDecision(decision) {
    if (!missionId || !analysis) {
      return;
    }
    if (!decisionReason.trim()) {
      setDecisionError(
        "Please provide a reason for this decision."
      );
      setDecisionMessage("");
      return;
    }

    try {
      setDecisionSubmitting(true);
      setDecisionError("");
      setDecisionMessage("");

    const configuration =
      selectedScenario?.configuration || {
        altitude:
          analysis?.inputs?.altitudeKm ??
          mission?.altitude,

        inclination:
          analysis?.inputs?.inclinationDeg ??
          mission?.inclination,

        duration:
          analysis?.inputs?.durationDays ??
          mission?.duration
      };

    const riskSnapshot =
      selectedScenario?.risk || {
        score:
          analysis?.risk?.score ?? 0,

        level:
          analysis?.risk?.level || "LOW"
      };

    const environmentSnapshot =
      selectedScenario?.environment || {
        score:
          intelligence?.environment?.score ?? 0,

        level:
          intelligence?.environment?.level ||
          "LOW"
      };

      const data = await createMissionDecision(
        missionId,
        {
          decision,
          configuration,
          risk: riskSnapshot,
          environment: environmentSnapshot,
          reason: decisionReason.trim(),
          source:
            selectedScenario
              ? "SCENARIO_SIMULATION"
              : "CURRENT_CONFIGURATION",

          scenarioId:
            selectedScenario?.assessmentId || null
        }
      );

      if (data.mission) {
        setMission(data.mission);
      }

      if (
        data.decision?.decision === "APPROVE" &&
        selectedScenario
      ) {
        setApprovedScenario(
          selectedScenario
        );
      }

      setSelectedScenario(null);
      if (data.mission) {
        setMission(data.mission);
      }

      if (data.decision) {
        setDecisions((current) => [
          data.decision,
          ...current
        ]);
      }
      setDecisionChoice(decision);
      setDecisionReason("");

      setDecisionMessage(
        `${decision} decision recorded successfully.`
      );

    } catch (requestError) {
      console.error(
        "Failed to record mission decision:",
        requestError
      );

      setDecisionError(
        requestError.message ||
          "Unable to record mission decision."
      );
    } finally {
      setDecisionSubmitting(false);
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
          historyData,
          decisionsData
        ] = await Promise.all([
          getMissionById(missionId),
          getMissionAnalysis(missionId),
          getMissionIntelligence(missionId),
          getMissionAssessmentHistory(missionId),
          getMissionDecisions(missionId)
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
        setDecisions(
          decisionsData?.decisions ||
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
            OrbitForge could not obtain the required
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

          <p className="card-support-text">
            Deterministic assessment of the
            current mission configuration.
          </p>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            MISSION READINESS
          </span>

          <strong className="large-number">
            {readiness?.label ||
              "Baseline"}
          </strong>

          <p>
            {readiness?.explanation ||
              "No additional readiness information is available."}
          </p>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            ENVIRONMENT
          </span>

          <strong className="large-number">
            {environmentScore}
            <span className="number-suffix">
              /100
            </span>
          </strong>

          <span
            className={`risk-badge ${environmentLevel}`}
          >
            {environment?.level || "LOW"}
          </span>

          <p>
            {environmentPosture}.
            Environmental exposure is modeled from
            orbital altitude and inclination.
          </p>
        </article>

        <article className="risk-summary-card">
          <span className="metric-label">
            PRIMARY CONCERN
          </span>

          <strong className="large-number">
            {primaryConcern.title}
          </strong>

          {primaryConcern.severity && (
            <span
              className={`severity-badge ${String(
                primaryConcern.severity
              ).toLowerCase()}`}
            >
              {primaryConcern.severity}
            </span>
          )}

          <p>
            {primaryConcern.explanation}
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
              OrbitForge analysis engine.
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

            <p className="muted">
              Prioritized actions derived from the
              current mission risk and environmental
              assessment.
            </p>
          </div>

          {actions.length > 0 && (
            <span className="history-count">
              {actions.length} action
              {actions.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {actions.length === 0 ? (
          <div className="empty-state compact">
            <h3>
              No Additional Actions
            </h3>

            <p>
              The current configuration does not
              require additional modeled actions.
              Continue baseline mission monitoring.
            </p>
          </div>
        ) : (
          <div className="action-list">
            {actions.map((action, index) => {
              const actionPriority =
                String(
                  action.priority || "MEDIUM"
                ).toLowerCase();

              return (
                <article
                  className="action-card"
                  key={`${action.title}-${index}`}
                >
                  <div className="action-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="action-content">
                    <div className="action-heading">
                      <div>
                        <span className="metric-label">
                          ACTION {String(index + 1).padStart(2, "0")}
                        </span>

                        <h3>
                          {action.title ||
                            "Review mission condition"}
                        </h3>
                      </div>

                      <span
                        className={`action-priority ${actionPriority}`}
                      >
                        {String(
                          action.priority || "MEDIUM"
                        ).toUpperCase()}
                      </span>
                    </div>

                    <p>
                      {action.reason ||
                        "Evaluate this condition before proceeding."}
                    </p>

                    <div className="action-footer">
                      <span className="action-status">
                        {actionPriority === "high"
                          ? "REQUIRES ATTENTION"
                          : actionPriority === "medium"
                            ? "REVIEW RECOMMENDED"
                            : "MONITOR"}
                      </span>

                      <span className="action-sequence">
                        Priority {index + 1}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
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
              Modeled environmental conditions based
              on the current orbital configuration.
            </p>
          </div>

          <span
            className={`risk-badge ${environmentLevel}`}
          >
            {environment?.level || "LOW"}
          </span>
        </div>

        <div className="environment-overview">

          {/* Environment score */}

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

            <p className="card-support-text">
              This score represents modeled exposure
              from the selected orbital altitude and
              inclination.
            </p>
          </div>

          {/* Environmental factors */}

          <div className="environment-factor-grid">

            {environmentFactors.length === 0 ? (
              <div className="environment-clear">
                <span className="metric-label">
                  ENVIRONMENT STATUS
                </span>

                <h3>
                  Baseline environmental exposure
                </h3>

                <p>
                  No elevated environmental factors
                  were identified for the current
                  orbital configuration.
                </p>

                <span className="environment-status">
                  BASELINE
                </span>
              </div>
            ) : (
              environmentFactors.map(
                (factor, index) => {
                  const factorLevel =
                    String(
                      factor.level || "LOW"
                    ).toLowerCase();

                  const factorScore =
                    Number(factor.score) || 0;

                  return (
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
                          className={`severity-badge ${factorLevel}`}
                        >
                          {String(
                            factor.level || "LOW"
                          ).toUpperCase()}
                        </span>
                      </div>

                      <div className="environment-factor-score">
                        <span>
                          Contribution
                        </span>

                        <strong>
                          +{factorScore} points
                        </strong>
                      </div>

                      <p>
                        {factor.explanation}
                      </p>

                      {factor.signal && (
                        <span className="risk-signal">
                          SIGNAL: {factor.signal}
                        </span>
                      )}
                    </article>
                  );
                }
              )
            )}

          </div>
        </div>

        {/* Methodology */}

        {environmentMethodology?.description && (
          <div className="environment-methodology">

            <div>
              <span className="metric-label">
                ASSESSMENT METHODOLOGY
              </span>

              <p>
                {environmentMethodology.description}
              </p>
            </div>

            {environmentMethodology.version && (
              <span className="methodology-version">
                MODEL{" "}
                {environmentMethodology.version}
              </span>
            )}
          </div>
        )}

        <div className="environment-disclaimer">
          <span>MODEL LIMITATION</span>

          <p>
            This is a modeled environmental assessment,
            not a live space-weather feed. Actual
            environmental conditions may vary and should
            be validated against appropriate operational
            data before mission decisions.
          </p>
        </div>
      </section>

      {/* =====================================================
          SCENARIO SIMULATOR
          ===================================================== */}

      <section className="mission-workflow" aria-label="Mission decision workflow">
        <div className="mission-workflow-heading">
          <span className="section-kicker">MISSION LIFECYCLE</span>
          <strong>Current configuration → scenario → decision → reassessment</strong>
        </div>

        <ol className="mission-workflow-steps">
          <li className="complete"><span>1</span> Current configuration</li>
          <li className={selectedScenario ? "complete" : "active"}><span>2</span> Propose & compare</li>
          <li className={selectedScenario ? "active" : ""}><span>3</span> Record decision</li>
          <li className={activeApprovedScenario ? "active" : ""}><span>4</span> Apply & reassess</li>
        </ol>
      </section>

      <ScenarioSimulator
        key={`${missionId}-${altitude}-${inclination}-${duration}`}
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
          handleScenarioSimulationComplete
        }
        onScenarioSelect={
          handleScenarioSelect
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

            {[...assessmentHistory]
              .sort(
                (first, second) =>
                  new Date(second?.createdAt || 0) -
                  new Date(first?.createdAt || 0)
              )
              .map(
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
                        Recorded {date}
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
          DECISION CENTER
          ===================================================== */}

      <section className="panel decision-center-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">
              DECISION RECORD
            </span>

            <h2>
              Decision Center
            </h2>

            <p className="muted">
              {selectedScenario
                ? "Record a human decision for the selected scenario configuration."
                : "Record a human decision for the current mission configuration."}
            </p>
          </div>

          {mission?.decision?.label && (
            <span className="priority-badge">
              {mission.decision.label}
            </span>
          )}
        </div>
        {selectedScenario && (
          <div className="decision-context-banner">
            <span className="metric-label">
              SCENARIO SELECTED
            </span>

            <strong>
              {selectedScenario.configuration.altitude} km
              {" / "}
              {selectedScenario.configuration.inclination}°
              {" / "}
              {selectedScenario.configuration.duration} days
            </strong>

            <span className="muted">
              Decision will be linked to the
              scenario assessment.
            </span>
          </div>
        )}
        {selectedScenario && (
          <div className="decision-context-panel">
            <div className="decision-context-header">
              <div>
                <span className="metric-label">
                  DECISION CONTEXT
                </span>

                <strong>
                  Scenario assessment snapshot
                </strong>
              </div>

              <span className="risk-badge moderate">
                {selectedScenario.risk?.level ||
                  "ASSESSED"}
              </span>
            </div>

            <div className="decision-context-grid">

              <div>
                <span className="metric-label">
                  CONFIGURATION
                </span>

                <strong>
                  {selectedScenario.configuration.altitude} km
                  {" • "}
                  {selectedScenario.configuration.inclination}°
                  {" • "}
                  {selectedScenario.configuration.duration} days
                </strong>
              </div>

              <div>
                <span className="metric-label">
                  RISK ASSESSMENT
                </span>

                <strong>
                  {risk?.score ?? 0}/100
                  {" → "}
                  {selectedScenario.risk?.score ?? 0}/100
                </strong>

                <span className="muted">
                  {risk?.level || "UNKNOWN"}
                  {" → "}
                  {selectedScenario.risk?.level ||
                    "UNKNOWN"}
                </span>
              </div>

              <div>
                <span className="metric-label">
                  ENVIRONMENT
                </span>

                <strong>
                  {Number(environment?.score) || 0}/100
                  {" → "}
                  {Number(
                    selectedScenario.environment?.score
                  ) || 0}/100
                </strong>

                <span className="muted">
                  {environment?.level || "UNKNOWN"}
                  {" → "}
                  {selectedScenario.environment?.level ||
                    "UNKNOWN"}
                </span>
              </div>

              <div>
                <span className="metric-label">
                  ASSESSMENT SOURCE
                </span>

                <strong>
                  SCENARIO SIMULATION
                </strong>

                <span className="muted">
                  Persisted assessment snapshot
                </span>
              </div>

            </div>
          </div>
        )}
        {activeApprovedScenario && (
          <div className="scenario-apply-panel">
            <div>
              <span className="risk-badge moderate">
                APPROVED
              </span>
              <span className="metric-label">
                APPROVED SCENARIO
              </span>

              <strong>
                {activeApprovedScenario.configuration.altitude} km
                {" / "}
                {activeApprovedScenario.configuration.inclination}°
                {" / "}
                {activeApprovedScenario.configuration.duration} days
              </strong>

              <p className="muted">
                Apply this approved scenario to replace
                the current mission configuration.
                The mission will return to pending review
                so the new configuration can be reassessed.
              </p>
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={
                handleApplyApprovedScenario
              }
              disabled={
                applyingScenario ||
                !activeApprovedScenario.assessmentId
              }
            >
              {applyingScenario
                ? "Applying Scenario..."
                : "Apply Approved Scenario"}
            </button>

            {applyScenarioError && (
              <div className="decision-feedback error">
                {applyScenarioError}
              </div>
            )}

            {applyScenarioMessage && (
              <div className="decision-feedback success">
                {applyScenarioMessage}
              </div>
            )}
          </div>
        )}
        <div className="decision-snapshot">
          <div>
            <span className="metric-label">
              {decisionSnapshotLabel}
            </span>

            <strong>
              {decisionRisk?.score ?? 0}/100
            </strong>

            <span>
              {decisionRisk?.level || "LOW"}
            </span>
          </div>

          <div>
            <span className="metric-label">
              ENVIRONMENT
            </span>

            <strong>
              {decisionEnvironmentScore}/100
            </strong>

            <span>
              {decisionEnvironment?.level || "LOW"}
            </span>
          </div>

          <div>
            <span className="metric-label">
              PRIORITY
            </span>

            <strong>
              {priority}
            </strong>
          </div>
        </div>

        <div className="decision-form">

          <span className="metric-label">
            SELECT DECISION
          </span>

          <div className="decision-options">

            {["APPROVE", "REVIEW", "REJECT"].map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  className={`decision-option ${option.toLowerCase()} ${
                    decisionChoice === option
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setDecisionChoice(option)
                  }
                  disabled={decisionSubmitting}
                  aria-pressed={decisionChoice === option}
                >
                  {option}
                </button>
              )
            )}

          </div>
          {decisionChoice && (
            <div className="decision-consequence">
              {decisionChoice === "APPROVE" && (
                <>
                  <strong>APPROVE</strong>
                  <span>
                    Approving a scenario marks it ready to apply.
                    The current mission configuration remains unchanged
                    until you explicitly apply the approved scenario.
                  </span>
                </>
              )}

              {decisionChoice === "REVIEW" && (
                <>
                  <strong>REVIEW</strong>
                  <span>
                    Hold the current configuration for further analysis
                    before operational approval.
                  </span>
                </>
              )}

              {decisionChoice === "REJECT" && (
                <>
                  <strong>REJECT</strong>
                  <span>
                    Reject this configuration from operational
                    progression. A scenario rejection leaves the current
                    mission configuration unchanged.
                  </span>
                </>
              )}
            </div>
          )}
          <label className="decision-reason-label">
            <span className="metric-label">
              DECISION REASON
            </span>

            <textarea
              value={decisionReason}
              onChange={(event) =>
                setDecisionReason(event.target.value)
              }
              placeholder="Explain why this mission configuration should be approved, reviewed, or rejected..."
              rows={4}
              disabled={decisionSubmitting}
            />
          </label>

          {decisionError && (
            <div className="decision-feedback error">
              {decisionError}
            </div>
          )}

          {decisionMessage && (
            <div className="decision-feedback success">
              {decisionMessage}
            </div>
          )}

          <button
            type="button"
            className="button button-primary"
            disabled={
              decisionSubmitting ||
              !decisionChoice ||
              !decisionReason.trim()
            }
            onClick={() =>
              handleMissionDecision(decisionChoice)
            }
          >
            {decisionSubmitting
              ? "Recording Decision..."
              : decisionChoice
                ? `Record ${decisionChoice} Decision`
                : "Select a Decision"}
          </button>

        </div>

        {decisions.length > 0 && (
          <div className="decision-history">

            <div className="panel-header">
              <div>
                <span className="section-kicker">
                  AUDIT TRAIL
                </span>

                <h3>
                  Decision History
                </h3>
              </div>
            </div>

            <div className="decision-history-list">

              {decisions.map(
                (decision, index) => (
                  <article
                    className="decision-history-card"
                    key={
                      decision?._id ||
                      `${decision?.decision}-${index}`
                    }
                  >
                    <div>
                      <span
                        className={`decision-history-status ${
                          String(
                            decision?.decision ||
                              "REVIEW"
                          ).toLowerCase()
                        }`}
                      >
                        {decision?.decision ||
                          "REVIEW"}
                      </span>

                      <span className="decision-history-date">
                        {decision?.createdAt
                          ? new Date(
                              decision.createdAt
                            ).toLocaleString()
                          : "Unknown time"}
                      </span>
                    </div>

                    <p>
                      {decision?.reason ||
                        "No reason recorded."}
                    </p>

                    <div className="decision-history-meta">
                      <span>
                        Risk:{" "}
                        {decision?.risk?.score ??
                          0}
                        /100
                      </span>

                      <span>
                        Environment:{" "}
                        {decision?.environment
                          ?.score ?? 0}
                        /100
                      </span>

                      <span>
                        Source:{" "}
                        {decision?.source ===
                        "SCENARIO_SIMULATION"
                          ? "Scenario"
                          : "Current configuration"}
                      </span>
                    </div>
                  </article>
                )
              )}

            </div>
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
            "OrbitForge uses an explainable deterministic mission-risk assessment model."}
        </p>

        {methodology?.version && (
          <span className="methodology-version">
            Engine version{" "}
            {methodology.version}
          </span>
        )}

        {methodology?.provenance && (
          <span className="methodology-version">
            {methodology.provenance}
          </span>
        )}

      </section>

      {/* =====================================================
          RESEARCH RECORD & INTEGRITY
          Milestone 1A Trust Foundation
          Backend data not yet available — components render
          their graceful "pending" state until the future
          /api/research and /api/research/:id/verify endpoints
          are implemented.
          ===================================================== */}

      <section className="trust-section panel">
        <div className="trust-section__header panel-header">
          <div>
            <span className="trust-section__kicker">
              RESEARCH PROVENANCE
            </span>

            <h2 className="trust-section__heading">
              Research Record &amp; Integrity
            </h2>

            <p className="trust-section__subtitle">
              Scientific provenance, data lineage, and SHA-256 integrity
              verification for this mission&apos;s analysis record.
            </p>
          </div>
        </div>

        <div className="trust-backend-notice">
          <span
            className="trust-backend-notice__icon"
            aria-hidden="true"
          >
            ◌
          </span>

          <div>
            <strong>
              Research Record Persistence — Planned (Milestone 1A Backend)
            </strong>

            <p>
              The backend will soon persist analysis runs as verifiable research
              records with SHA-256 integrity hashes. When available, this
              section will display the full record, digest, and verification
              result. The provenance chain below reflects the current analysis
              flow.
            </p>
          </div>
        </div>

        <div className="trust-section__grid">
          {/* Research Record — no backend data yet, all fields gracefully null */}
          <ResearchRecordPanel
            missionName={missionName}
            missionId={missionId}
            recordId={null}
            analysisRunId={null}
            createdAt={null}
            evaluatedAt={null}
            modelVersion={methodology?.version || null}
            canonicalizationVersion={null}
            provenanceNote={methodology?.provenance || null}
            integrityStatus="UNAVAILABLE"
            verification={null}
          />

          {/* Provenance Chain — uses live mission data where available */}
          <ProvenanceChain
            missionName={missionName}
            analysisRunId={null}
            modelVersion={methodology?.version || null}
            canonicalizationVersion={null}
            integrityHash={null}
            verificationStatus="UNAVAILABLE"
          />
        </div>
      </section>

    </main>
  );
}

export default Analysis;
