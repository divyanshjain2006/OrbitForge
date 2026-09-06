import { useMemo, useState } from "react";
import { runScenario } from "../services/api";

function ScenarioSimulator({
  missionId,
  currentConfiguration,
  currentRisk,
  onSimulationComplete, 
  onScenarioSelect
}) {
  const initialValues = useMemo(
    () => ({
      altitude:
        Number(currentConfiguration?.altitude) || 550,
      inclination:
        Number(currentConfiguration?.inclination) || 51.6,
      duration:
        Number(currentConfiguration?.duration) || 365
    }),
    [currentConfiguration]
  );

  const [altitude, setAltitude] = useState(
    initialValues.altitude
  );
  const [inclination, setInclination] = useState(
    initialValues.inclination
  );
  const [duration, setDuration] = useState(
    initialValues.duration
  );

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSimulation(event) {
    event.preventDefault();

    // A fresh run supersedes any scenario that may still be staged
    // in the decision center, preventing a stale decision snapshot.
    onScenarioSelect?.(null);

    if (!missionId) {
      setError("Mission ID is missing.");
      return;
    }

    const scenario = {
      altitude: Number(altitude),
      inclination: Number(inclination),
      duration: Number(duration)
    };

    if (
      !Number.isFinite(scenario.altitude) ||
      scenario.altitude < 100 ||
      scenario.altitude > 2000
    ) {
      setError(
        "Altitude must be between 100 km and 2000 km."
      );
      return;
    }

    if (
      !Number.isFinite(scenario.inclination) ||
      scenario.inclination < 0 ||
      scenario.inclination > 180
    ) {
      setError(
        "Inclination must be between 0° and 180°."
      );
      return;
    }

    if (
      !Number.isFinite(scenario.duration) ||
      scenario.duration < 1 ||
      scenario.duration > 3650
    ) {
      setError(
        "Mission duration must be between 1 and 3650 days."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await runScenario(
        missionId,
        scenario
      );

      setResult(data);

      if (onSimulationComplete) {
        await onSimulationComplete(data);
      }
    } catch (err) {
      console.error(
        "Scenario simulation failed:",
        err
      );

      setError(
        err.message ||
          "Unable to simulate this scenario."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetScenario() {
    setAltitude(initialValues.altitude);
    setInclination(initialValues.inclination);
    setDuration(initialValues.duration);
    setResult(null);
    setError("");
    onScenarioSelect?.(null);
  }

  const scenario = result?.result || result;

  const scenarioRisk =
    scenario?.scenario?.risk || null;

  const scenarioEnvironment =
    scenario?.scenario?.environment || null;

  const comparison =
    scenario?.comparison || null;

  const environmentComparison =
    scenario?.environmentComparison || null;

  const overallDecision =
    scenario?.overallDecision || null;

  const scenarioConfiguration =
    scenario?.scenario?.configuration || null;

  const factorComparison =
    comparison?.factorComparison || [];

  const environmentFactors =
    environmentComparison?.factorComparison || [];

  const currentScore =
    Number(
      scenario?.current?.risk?.score ??
        currentRisk?.score
    ) || 0;

  const scenarioScore =
    Number(scenarioRisk?.score) || 0;

  const currentEnvironmentScore =
    Number(
      scenario?.current?.environment?.score
    ) || 0;

  const scenarioEnvironmentScore =
    Number(scenarioEnvironment?.score) || 0;

  const scoreDelta =
    Number(comparison?.scoreDelta) || 0;

  const environmentScoreDelta =
    Number(
      environmentComparison?.scoreDelta
    ) || 0;

  const absoluteChange =
    Number(comparison?.absoluteChange) || 0;

  const environmentAbsoluteChange =
    Number(
      environmentComparison?.absoluteChange
    ) || 0;

  const improved =
    comparison?.direction === "IMPROVED";

  const worsened =
    comparison?.direction === "WORSENED";

  const unchanged =
    comparison?.direction === "UNCHANGED" ||
    (!improved && !worsened);

  function formatDelta(value) {
    if (value > 0) {
      return `+${value}`;
    }

    return String(value);
  }

  function getComparisonClass(value) {
    if (value < 0) {
      return "scenario-delta improved";
    }

    if (value > 0) {
      return "scenario-delta worsened";
    }

    return "scenario-delta unchanged";
  }

  function getDecisionClass() {
    if (overallDecision?.status === "IMPROVED") {
      return "scenario-decision-improved";
    }

    if (overallDecision?.status === "WORSENED") {
      return "scenario-decision-worsened";
    }

    return "scenario-decision-unchanged";
  }

  return (
    <section className="panel scenario-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">
            DECISION SIMULATION
          </span>

          <h2>Scenario Simulator</h2>

          <p className="muted">
            Test alternate orbital configurations
            before changing the mission.
          </p>
        </div>

        {result && scenarioRisk && (
          <span
            className={`risk-badge risk-${String(
              scenarioRisk.level
            ).toLowerCase()}`}
          >
            {scenarioRisk.level} RISK
          </span>
        )}
      </div>

      <form
        className="scenario-form"
        onSubmit={handleSimulation}
      >
        <div className="scenario-input-grid">
          <label className="scenario-field">
            <span>Altitude</span>

            <div className="scenario-input-wrapper">
              <input
                type="number"
                min="100"
                max="2000"
                step="1"
                value={altitude}
                onChange={(event) =>
                  setAltitude(event.target.value)
                }
              />

              <small>km</small>
            </div>
          </label>

          <label className="scenario-field">
            <span>Inclination</span>

            <div className="scenario-input-wrapper">
              <input
                type="number"
                min="0"
                max="180"
                step="0.1"
                value={inclination}
                onChange={(event) =>
                  setInclination(event.target.value)
                }
              />

              <small>°</small>
            </div>
          </label>

          <label className="scenario-field">
            <span>Mission Duration</span>

            <div className="scenario-input-wrapper">
              <input
                type="number"
                min="1"
                max="3650"
                step="1"
                value={duration}
                onChange={(event) =>
                  setDuration(event.target.value)
                }
              />

              <small>days</small>
            </div>
          </label>
        </div>

        <div className="scenario-input-hint">
          <span>Allowed altitude: 100–2000 km</span>
          <span>Inclination: 0–180°</span>
          <span>Duration: 1–3650 days</span>
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <div className="scenario-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading
              ? "Simulating..."
              : "Run Scenario"}
          </button>

          <button
            type="button"
            className="button button-secondary"
            onClick={resetScenario}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {result && (
        <div className="scenario-results">
          <div className="scenario-result-header">
            <div>
              <span className="section-kicker">
                SIMULATION RESULT
              </span>

              <h3>
                {improved
                  ? "Scenario improves mission risk"
                  : worsened
                    ? "Scenario increases mission risk"
                    : "Scenario leaves mission risk unchanged"}
              </h3>
            </div>

            <div
              className={getComparisonClass(
                scoreDelta
              )}
            >
              {formatDelta(scoreDelta)} pts
            </div>
          </div>

          <div className="scenario-summary">
            <div className="scenario-summary-card">
              <span>Current Risk</span>

              <strong>{currentScore}</strong>

              <small>
                {scenario?.current?.risk?.level ||
                  currentRisk?.level ||
                  "UNKNOWN"}
              </small>
            </div>

            <div className="scenario-summary-arrow">
              →
            </div>

            <div className="scenario-summary-card">
              <span>Scenario Risk</span>

              <strong>{scenarioScore}</strong>

              <small>
                {scenarioRisk?.level || "UNKNOWN"}
              </small>
            </div>
          </div>

          <div className="scenario-environment-summary">
            <div className="scenario-subheader">
              <div>
                <span className="section-kicker">
                  SPACE ENVIRONMENT
                </span>

                <h4>
                  Modeled Environmental Exposure
                </h4>
              </div>

              <span
                className={getComparisonClass(
                  environmentScoreDelta
                )}
              >
                {formatDelta(
                  environmentScoreDelta
                )}{" "}
                pts
              </span>
            </div>

            <div className="scenario-summary">
              <div className="scenario-summary-card">
                <span>Current Environment</span>

                <strong>
                  {currentEnvironmentScore}
                </strong>

                <small>
                  {scenario?.current?.environment
                    ?.level || "UNKNOWN"}
                </small>
              </div>

              <div className="scenario-summary-arrow">
                →
              </div>

              <div className="scenario-summary-card">
                <span>Scenario Environment</span>

                <strong>
                  {scenarioEnvironmentScore}
                </strong>

                <small>
                  {scenarioEnvironment?.level ||
                    "UNKNOWN"}
                </small>
              </div>
            </div>

            {environmentComparison?.explanation && (
              <p className="muted">
                {environmentComparison.explanation}
              </p>
            )}
          </div>

          {overallDecision && (
            <div
              className={`scenario-decision ${getDecisionClass()}`}
            >
              <div>
                <span className="section-kicker">
                  OVERALL DECISION
                </span>

                <strong>
                  {overallDecision.label}
                </strong>
              </div>

              <p>
                {overallDecision.explanation}
              </p>
            </div>
          )}

          <div
            className={`scenario-decision ${
              improved
                ? "scenario-decision-improved"
                : worsened
                  ? "scenario-decision-worsened"
                  : "scenario-decision-unchanged"
            }`}
          >
            <div>
              <span className="section-kicker">
                DECISION IMPACT
              </span>

              <strong>
                {improved
                  ? "Recommended configuration"
                  : worsened
                    ? "Higher-risk configuration"
                    : "No material risk change"}
              </strong>
            </div>

            <p>
              {comparison?.explanation ||
                "The scenario was evaluated against the current mission configuration."}
            </p>
          </div>

          {scenarioConfiguration && (
            <div className="scenario-configuration">
              <div className="scenario-subheader">
                <div>
                  <span className="section-kicker">
                    PROPOSED CONFIGURATION
                  </span>

                  <h4>Orbital Parameters</h4>
                </div>
              </div>

              <div className="scenario-configuration-grid">
                <div>
                  <span>Altitude</span>

                  <strong>
                    {scenarioConfiguration.altitude} km
                  </strong>
                </div>

                <div>
                  <span>Inclination</span>

                  <strong>
                    {scenarioConfiguration.inclination}°
                  </strong>
                </div>

                <div>
                  <span>Duration</span>

                  <strong>
                    {scenarioConfiguration.duration} days
                  </strong>
                </div>
              </div>
            </div>
          )}

          {factorComparison.length > 0 && (
            <div className="scenario-factor-comparison">
              <div className="scenario-subheader">
                <div>
                  <span className="section-kicker">
                    RISK FACTOR COMPARISON
                  </span>

                  <h4>What changed?</h4>
                </div>

                <span className="muted">
                  {absoluteChange} points changed
                </span>
              </div>

              <div className="scenario-factor-list">
                {factorComparison.map(
                  (factor, index) => {
                    const delta =
                      Number(
                        factor.scoreDelta
                      ) || 0;

                    return (
                      <div
                        className="scenario-factor"
                        key={`${factor.category}-${index}`}
                      >
                        <div className="scenario-factor-main">
                          <div>
                            <span className="scenario-factor-category">
                              {factor.category}
                            </span>

                            <strong>
                              {factor.currentScore} →{" "}
                              {factor.scenarioScore}
                            </strong>
                          </div>

                          <span
                            className={getComparisonClass(
                              delta
                            )}
                          >
                            {formatDelta(delta)}
                          </span>
                        </div>

                        <div className="scenario-factor-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.abs(delta) * 2
                                )
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {environmentFactors.length > 0 && (
            <div className="scenario-factor-comparison">
              <div className="scenario-subheader">
                <div>
                  <span className="section-kicker">
                    ENVIRONMENT FACTOR COMPARISON
                  </span>

                  <h4>Environmental changes</h4>
                </div>

                <span className="muted">
                  {environmentAbsoluteChange}{" "}
                  points changed
                </span>
              </div>

              <div className="scenario-factor-list">
                {environmentFactors.map(
                  (factor, index) => {
                    const delta =
                      Number(
                        factor.scoreDelta
                      ) || 0;

                    return (
                      <div
                        className="scenario-factor"
                        key={`${factor.category}-${index}`}
                      >
                        <div className="scenario-factor-main">
                          <div>
                            <span className="scenario-factor-category">
                              {factor.category}
                            </span>

                            <strong>
                              {factor.currentScore} →{" "}
                              {factor.scenarioScore}
                            </strong>
                          </div>

                          <span
                            className={getComparisonClass(
                              delta
                            )}
                          >
                            {formatDelta(delta)}
                          </span>
                        </div>

                        <div className="scenario-factor-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.abs(delta) * 2
                                )
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {scenarioRisk?.recommendations?.length >
            0 && (
            <div className="scenario-recommendations">
              <div className="scenario-subheader">
                <div>
                  <span className="section-kicker">
                    DECISION SUPPORT
                  </span>

                  <h4>Recommended Actions</h4>
                </div>
              </div>

              <ol>
                {scenarioRisk.recommendations.map(
                  (recommendation, index) => (
                    <li
                      key={`${recommendation}-${index}`}
                    >
                      <span>
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <p>{recommendation}</p>
                    </li>
                  )
                )}
              </ol>
            </div>
          )}

          {unchanged && (
            <div className="scenario-note">
              The proposed configuration does not
              materially change the current deterministic
              risk assessment.
            </div>
          )}
        </div>
      )}
      {scenarioConfiguration &&
        result?.assessmentId &&
        onScenarioSelect && (
          <div className="scenario-decision-action">
            <button
              type="button"
              className="button button-primary"
            onClick={() =>
              onScenarioSelect({
                  assessmentId:
                    result.assessmentId,

                  configuration:
                    scenarioConfiguration,

                  risk:
                    scenarioRisk,

                  environment:
                    scenarioEnvironment,

                  overallDecision
                })
            }
          >
              Continue to Decision Center →
            </button>

            <p className="muted">
              This keeps the scenario configuration,
              risk assessment, and environmental
              assessment linked to the decision record.
            </p>
          </div>
      )}
    </section>
  );
}

export default ScenarioSimulator;
