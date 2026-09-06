import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  deleteMission,
  getMissions,
  getMissionIntelligence
} from "../services/api";

function getRiskLevel(intelligence) {
  return (
    intelligence?.riskBreakdown?.level ||
    intelligence?.risk?.level ||
    "UNKNOWN"
  ).toUpperCase();
}

function getRiskScore(intelligence) {
  return (
    intelligence?.riskBreakdown?.score ??
    intelligence?.risk?.score ??
    null
  );
}

function getOperationalPosture(intelligence) {
  return (
    intelligence?.operationalPosture?.label ||
    intelligence?.risk?.operationalPosture?.label ||
    "Assessment unavailable"
  );
}

function getMissionLifecycle(mission) {
  const status =
    mission?.decision?.status ||
    "PENDING_REVIEW";

  const labels = {
    PENDING_REVIEW: "PENDING REVIEW",
    SCENARIO_APPROVED: "SCENARIO READY TO APPLY",
    APPROVED: "MISSION APPROVED",
    HOLD: "ON HOLD",
    REJECTED: "MISSION REJECTED"
  };

  return {
    status,
    label: labels[status] || "STATUS UNKNOWN"
  };
}

function getRiskClass(level) {
  switch (level) {
    case "LOW":
      return "risk-low";

    case "MODERATE":
    case "MEDIUM":
      return "risk-medium";

    case "HIGH":
      return "risk-high";

    case "CRITICAL":
      return "risk-critical";

    default:
      return "risk-unknown";
  }
}

function Dashboard() {
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [intelligence, setIntelligence] = useState({});
  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const data = await getMissions();
        const loadedMissions = data.missions || [];

        if (cancelled) {
          return;
        }

        setMissions(loadedMissions);

        if (loadedMissions.length === 0) {
          setIntelligence({});
          return;
        }

        setIntelligenceLoading(true);

        const results = await Promise.allSettled(
          loadedMissions.map(async (mission) => {
            const result =
              await getMissionIntelligence(
                mission._id
              );

            return {
              missionId: mission._id,
              intelligence:
                result.intelligence || result
            };
          })
        );

        if (cancelled) {
          return;
        }

        const intelligenceMap = {};

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            intelligenceMap[
              result.value.missionId
            ] = result.value.intelligence;
          }
        });

        setIntelligence(intelligenceMap);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load dashboard:",
          err
        );

        setError(
          err.message ||
            "Unable to load mission dashboard."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIntelligenceLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshMissions() {
    try {
      setError("");

      const data = await getMissions();
      const loadedMissions = data.missions || [];

      setMissions(loadedMissions);

      if (loadedMissions.length === 0) {
        setIntelligence({});
        return;
      }

      setIntelligenceLoading(true);

      const results = await Promise.allSettled(
        loadedMissions.map(async (mission) => {
          const result =
            await getMissionIntelligence(
              mission._id
            );

          return {
            missionId: mission._id,
            intelligence:
              result.intelligence || result
          };
        })
      );

      const intelligenceMap = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          intelligenceMap[
            result.value.missionId
          ] = result.value.intelligence;
        }
      });

      setIntelligence(intelligenceMap);
    } catch (err) {
      console.error(
        "Failed to refresh missions:",
        err
      );

      setError(
        err.message ||
          "Unable to refresh mission dashboard."
      );
    } finally {
      setIntelligenceLoading(false);
    }
  }

  async function handleDelete(missionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this mission?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteMission(missionId);

      await refreshMissions();
    } catch (err) {
      console.error(
        "Failed to delete mission:",
        err
      );

      setError(
        err.message || "Unable to delete mission."
      );
    }
  }

  function handleAnalyze(missionId) {
    navigate(`/analysis/${missionId}`);
  }

  const riskSummary = missions.reduce(
    (summary, mission) => {
      const missionIntelligence =
        intelligence[mission._id];

      const level = getRiskLevel(
        missionIntelligence
      );

      if (level === "LOW") {
        summary.low += 1;
      } else if (
        level === "MEDIUM" ||
        level === "MODERATE"
      ) {
        summary.medium += 1;
      } else if (level === "HIGH") {
        summary.high += 1;
      } else if (level === "CRITICAL") {
        summary.critical += 1;
      }

      return summary;
    },
    {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  );

  return (
    <main>
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="page-eyebrow">
            ORBITAL MISSION CONTROL
          </p>

          <h1>OrbitForge</h1>

          <p className="page-subtitle">
            Mission intelligence, research provenance,
            and orbital risk assessment for LEO missions.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <Link
            to="/missions/new"
            className="button button-primary"
          >
            + Create Mission
          </Link>
        </div>
      </section>

      {/* =====================================================
          MISSION INTELLIGENCE SUMMARY
      ===================================================== */}

      {!loading && !error && missions.length > 0 && (
        <section className="dashboard-intelligence-grid">
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-label">
              TOTAL MISSIONS
            </span>

            <strong className="dashboard-stat-value">
              {missions.length}
            </strong>

            <span className="dashboard-stat-description">
              Registered orbital missions
            </span>
          </article>

          <article className="dashboard-stat-card dashboard-stat-low">
            <span className="dashboard-stat-label">
              LOW RISK
            </span>

            <strong className="dashboard-stat-value">
              {riskSummary.low}
            </strong>

            <span className="dashboard-stat-description">
              Baseline operating profile
            </span>
          </article>

          <article className="dashboard-stat-card dashboard-stat-medium">
            <span className="dashboard-stat-label">
              MODERATE
            </span>

            <strong className="dashboard-stat-value">
              {riskSummary.medium}
            </strong>

            <span className="dashboard-stat-description">
              Missions requiring monitoring
            </span>
          </article>

          <article className="dashboard-stat-card dashboard-stat-critical">
            <span className="dashboard-stat-label">
              HIGH / CRITICAL
            </span>

            <strong className="dashboard-stat-value">
              {riskSummary.high +
                riskSummary.critical}
            </strong>

            <span className="dashboard-stat-description">
              Missions requiring attention
            </span>
          </article>
        </section>
      )}

      {/* =====================================================
          MISSION OVERVIEW
      ===================================================== */}

      <section className="panel dashboard-mission-panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              MISSION FLEET
            </p>

            <h2>Mission Overview</h2>

            <span className="muted">
              {missions.length}{" "}
              {missions.length === 1
                ? "mission"
                : "missions"}{" "}
              registered
            </span>
          </div>

          {!loading &&
            missions.length > 0 && (
              <div className="dashboard-status-summary">
                <span className="dashboard-status-dot" />

                {intelligenceLoading
                  ? "Updating intelligence..."
                  : "Intelligence operational"}
              </div>
            )}
        </div>

        {loading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading-indicator" />

            <div>
              <strong>
                Loading mission intelligence
              </strong>

              <p>
                Retrieving orbital mission data...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="alert" role="alert">
            <strong>
              Unable to load mission control data
            </strong>

            <span>{error}</span>

            <button
              type="button"
              className="button button-secondary"
              onClick={refreshMissions}
            >
              Retry
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          missions.length === 0 && (
            <div className="empty-state">
              <h3>No missions registered</h3>

              <p>
                Create your first LEO mission to begin
                orbital analysis.
              </p>

              <Link
                to="/missions/new"
                className="button button-primary"
              >
                Create Your First Mission
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          missions.length > 0 && (
            <div className="mission-grid">
              {missions.map((mission) => {
                const missionIntelligence =
                  intelligence[mission._id];

                const riskLevel = getRiskLevel(
                  missionIntelligence
                );

                const riskScore = getRiskScore(
                  missionIntelligence
                );

                const posture =
                  getOperationalPosture(
                    missionIntelligence
                  );

                const riskClass =
                  getRiskClass(riskLevel);

                const lifecycle =
                  getMissionLifecycle(mission);

                return (
                  <article
                    className={`mission-card mission-card-intelligent ${riskClass}`}
                    key={mission._id}
                  >
                    {/* Card Header */}

                    <div className="mission-card-header">
                      <div className="mission-card-title">
                        <h3>{mission.name}</h3>

                        <span className="mission-id">
                          ID: {mission._id}
                        </span>
                      </div>

                      <div className="mission-card-badges">
                        <span
                          className={`mission-risk-badge ${riskClass}`}
                        >
                          {riskLevel === "UNKNOWN"
                            ? "ANALYZING"
                            : riskLevel}
                        </span>

                        <span
                          className={`mission-status ${lifecycle.status.toLowerCase()}`}
                        >
                          {lifecycle.label}
                        </span>
                      </div>
                    </div>

                    {/* Risk Intelligence */}

                    <div className="mission-risk-summary">
                      <div>
                        <span className="mission-risk-label">
                          MISSION RISK
                        </span>

                        <strong>
                          {riskScore === null
                            ? "—"
                            : `${riskScore}/100`}
                        </strong>
                      </div>

                      <div>
                        <span className="mission-risk-label">
                          POSTURE
                        </span>

                        <span className="mission-posture">
                          {posture}
                        </span>
                      </div>
                    </div>

                    {/* Orbital Parameters */}

                    <div className="mission-metrics">
                      <div className="metric">
                        <span className="metric-label">
                          Altitude
                        </span>

                        <span className="metric-value">
                          {mission.altitude} km
                        </span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">
                          Inclination
                        </span>

                        <span className="metric-value">
                          {mission.inclination}°
                        </span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">
                          Duration
                        </span>

                        <span className="metric-value">
                          {mission.duration} d
                        </span>
                      </div>
                    </div>

                    {/* Actions */}

                    <div className="mission-actions">
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() =>
                          handleAnalyze(
                            mission._id
                          )
                        }
                      >
                        Analyze Mission
                      </button>

                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() =>
                          handleDelete(
                            mission._id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}

export default Dashboard;