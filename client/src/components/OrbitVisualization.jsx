import { useEffect, useState } from "react";

function OrbitVisualization({
  altitude,
  inclination,
  velocity,
  period,
  revolutionsPerDay
}) {
  const normalizedAltitude = Math.max(
    Number(altitude) || 0,
    100
  );

  const normalizedInclination = Math.min(
    Math.max(Number(inclination) || 0, 0),
    180
  );

  const [orbitProgress, setOrbitProgress] = useState(0);

  useEffect(() => {
    let animationFrame;
    let startTime;

    function animate(timestamp) {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      setOrbitProgress((elapsed / 12000) % 1);

      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  /*
   * Convert inclination into a visual tilt.
   *
   * 0°   → -32.5°
   * 90°  → 0°
   * 180° → +32.5°
   *
   * This is a visual representation, not a physical
   * 3D orbital projection.
   */
  const inclinationTilt =
    (normalizedInclination / 180) * 65 - 32.5;

  /*
   * Keep the visual orbit within a sensible size.
   * The actual altitude is still displayed as a calculated input.
   */
  const altitudeScale = Math.min(
    1.25,
    Math.max(
      0.78,
      0.78 + normalizedAltitude / 2200
    )
  );

  return (
    <section className="orbit-visualization panel">
      <div className="panel-header orbit-panel-header">
        <div>
          <span className="section-kicker">
            ORBITAL VISUALIZATION
          </span>

          <h2>Mission Orbit</h2>

          <span className="muted">
            Modelled orbital geometry visualization
          </span>
        </div>

        <div className="orbit-model-status">
          <span className="model-dot" />
          MODEL VISUALIZATION
        </div>
      </div>

      <div className="orbit-stage">
        {/* Reference geometry */}

        <div className="orbit-grid-line horizontal" />

        <div className="orbit-grid-line vertical" />

        <div className="orbit-reference-ring ring-large" />

        <div className="orbit-reference-ring ring-small" />

        {/* =================================================
            ORBIT SYSTEM
            ================================================= */}

        <div
          className="orbit-system"
          style={{
            transform: `
              translate(-50%, -50%)
              rotate(${inclinationTilt}deg)
              scaleY(${altitudeScale})
            `
          }}
        >
          <div className="orbit-path">
            {/* Spacecraft */}
            <div
              className="orbit-spacecraft"
              style={{
                offsetDistance: `${orbitProgress * 100}%`
              }}
            >
              <div className="spacecraft-glow" />

              <span className="spacecraft-body">
                ◆
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            EARTH
            ================================================= */}

        <div className="earth">
          <div className="earth-atmosphere" />

          <div className="earth-core">
            <span>EARTH</span>
          </div>
        </div>

        {/* =================================================
            AXIS LABELS
            ================================================= */}

        <div className="orbit-axis-label orbit-axis-top">
          NORTH
        </div>

        <div className="orbit-axis-label orbit-axis-bottom">
          SOUTH
        </div>

        {/* =================================================
            ORBIT LABELS
            ================================================= */}

        <div className="orbit-label altitude-label">
          <span>ALTITUDE</span>

          <strong>
            {normalizedAltitude} km
          </strong>
        </div>

        <div className="orbit-label inclination-label">
          <span>INCLINATION</span>

          <strong>
            {normalizedInclination}°
          </strong>
        </div>
      </div>

      {/* Calculated circular-orbit summary; not telemetry. */}

      <div className="orbit-calculated-summary">
        <div className="calculated-item">
          <span>ORBIT TYPE</span>

          <strong>LEO</strong>
        </div>

        <div className="calculated-item">
          <span>VELOCITY</span>

          <strong>
            {velocity ?? "—"}{" "}
            <small>km/s</small>
          </strong>
        </div>

        <div className="calculated-item">
          <span>PERIOD</span>

          <strong>
            {period ?? "—"}{" "}
            <small>min</small>
          </strong>
        </div>

        <div className="calculated-item">
          <span>REV / DAY</span>

          <strong>
            {revolutionsPerDay ?? "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default OrbitVisualization;
