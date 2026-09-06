import { useEffect, useState } from "react";
import { getMissionAssessments } from "../services/api";

function formatDate(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

function getDecisionClass(decision) {
  const normalized = String(
    decision || ""
  ).toUpperCase();

  if (
    normalized.includes("IMPROVED") ||
    normalized.includes("APPROVED")
  ) {
    return "history-decision improved";
  }

  if (
    normalized.includes("CRITICAL") ||
    normalized.includes("HIGH")
  ) {
    return "history-decision danger";
  }

  if (
    normalized.includes("REVIEW") ||
    normalized.includes("PROCEEDING")
  ) {
    return "history-decision review";
  }

  return "history-decision";
}

function getAssessmentLabel(type) {
  const normalized = String(type || "").toUpperCase();

  if (normalized === "INITIAL_ASSESSMENT") {
    return "INITIAL ASSESSMENT";
  }

  if (normalized === "SCENARIO_SIMULATION") {
    return "SCENARIO SIMULATION";
  }

  if (normalized === "RISK_REASSESSMENT") {
    return "RISK REASSESSMENT";
  }

  return normalized.replace(/_/g, " ") || "ASSESSMENT";
}

function getRiskClass(level) {
  return String(level || "LOW")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getEnvironmentClass(level) {
  return String(level || "LOW")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function AssessmentHistory({ missionId }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!missionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getMissionAssessments(missionId);

        if (cancelled) {
          return;
        }

        setAssessments(
          data.assessments || []
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load assessment history:",
          err
        );

        setError(
          err.message ||
            "Unable to load assessment history."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [missionId]);

  return (
    <section className="panel assessment-history-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">
            DECISION HISTORY
          </span>

          <h2>Assessment Timeline</h2>

          <p className="muted">
            Track how mission risk, environmental
            exposure, and decisions changed across
            assessments and scenarios.
          </p>
        </div>

        {!loading && !error && (
          <span className="history-count">
            {assessments.length} assessment
            {assessments.length === 1
              ? ""
              : "s"}
          </span>
        )}
      </div>

      {loading && (
        <div className="empty-state">
          <p>
            Loading assessment history...
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          className="alert"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        assessments.length === 0 && (
          <div className="empty-state">
            <h3>No assessment history</h3>

            <p>
              Mission assessments will appear here
              as decisions are evaluated.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        assessments.length > 0 && (
          <div className="assessment-timeline">
            {assessments.map(
              (assessment, index) => {
                const risk =
                  assessment.risk || {};

                const environment =
                  assessment.environment || {};

                const configuration =
                  assessment.configuration || {};

                const decision =
                  assessment.decision ||
                  "NO DECISION";

                const riskLevel =
                  String(
                    risk.level || "LOW"
                  ).toLowerCase();

                const environmentLevel =
                  String(
                    environment.level || "LOW"
                  ).toLowerCase();

                const riskClass =
                  getRiskClass(riskLevel);

                const environmentClass =
                  getEnvironmentClass(
                    environmentLevel
                  );

                const isScenario =
                  assessment.type ===
                  "SCENARIO_SIMULATION";

                return (
                  <article
                    className={`assessment-event ${
                      isScenario
                        ? "assessment-event-scenario"
                        : "assessment-event-initial"
                    }`}
                    key={
                      assessment._id ||
                      `${assessment.type}-${index}`
                    }
                  >
                    <div className="assessment-marker">
                      <span />
                    </div>

                    <div className="assessment-content">
                      <div className="assessment-top">
                        <div>
                          <span className="assessment-type">
                            {getAssessmentLabel(
                              assessment.type
                            )}
                          </span>

                          <span className="assessment-time">
                            {formatDate(
                              assessment.createdAt
                            )}
                          </span>
                        </div>

                        <span
                          className={`risk-badge ${riskClass}`}
                        >
                          {risk.level ||
                            "LOW"}{" "}
                          RISK
                        </span>
                      </div>

                      <div className="assessment-metrics">
                        <div>
                          <span className="metric-label">
                            RISK SCORE
                          </span>

                          <strong>
                            {risk.score ?? 0}
                            /100
                          </strong>
                        </div>

                        <div>
                          <span className="metric-label">
                            ENVIRONMENT
                          </span>

                          <strong
                            className={`environment-value ${environmentClass}`}
                          >
                            {environment.level ||
                              "LOW"}
                          </strong>

                          <small>
                            {environment.score ??
                              0}
                            /100
                          </small>
                        </div>

                        <div>
                          <span className="metric-label">
                            ALTITUDE
                          </span>

                          <strong>
                            {configuration.altitude ??
                              "—"}{" "}
                            km
                          </strong>
                        </div>

                        <div>
                          <span className="metric-label">
                            INCLINATION
                          </span>

                          <strong>
                            {configuration.inclination ??
                              "—"}
                            °
                          </strong>
                        </div>

                        <div>
                          <span className="metric-label">
                            DURATION
                          </span>

                          <strong>
                            {configuration.duration ??
                              "—"}{" "}
                            days
                          </strong>
                        </div>
                      </div>

                      <div className="assessment-decision-row">
                        <span className="metric-label">
                          DECISION
                        </span>

                        <span
                          className={getDecisionClass(
                            decision
                          )}
                        >
                          {String(
                            decision
                          ).replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>

                      {assessment.summary && (
                        <p className="assessment-summary">
                          {assessment.summary}
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
    </section>
  );
}

export default AssessmentHistory;