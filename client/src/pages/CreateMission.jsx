import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createMission } from "../services/api";

function CreateMission() {
  const navigate = useNavigate();

  const [mission, setMission] = useState({
    name: "",
    altitude: "",
    inclination: "",
    duration: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setMission((currentMission) => ({
      ...currentMission,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createMission(mission);

      navigate("/");
    } catch (err) {
      console.error(
        "Mission creation failed:",
        err
      );

      setError(
        err.message ||
          "Unable to create mission."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="page-header">
        <p className="page-eyebrow">
          MISSION CONFIGURATION
        </p>

        <h1>Create Mission</h1>

        <p className="page-subtitle">
          Define the initial orbital parameters for a
          new LEO mission.
        </p>
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <h2>Orbital Parameters</h2>

            <span className="muted">
              Enter the planned mission configuration.
            </span>
          </div>
        </div>

        <form
          className="mission-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="name">
              Mission Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={mission.name}
              onChange={handleChange}
              placeholder="OrbitForge Demo Mission"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="altitude">
              Orbital Altitude
            </label>

            <input
              id="altitude"
              name="altitude"
              type="number"
              value={mission.altitude}
              onChange={handleChange}
              placeholder="550"
              min="100"
              max="2000"
              step="1"
              required
            />

            <p className="form-help">
              Distance above Earth's surface in
              kilometers.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="inclination">
              Orbital Inclination
            </label>

            <input
              id="inclination"
              name="inclination"
              type="number"
              value={mission.inclination}
              onChange={handleChange}
              placeholder="51.6"
              min="0"
              max="180"
              step="0.1"
              required
            />

            <p className="form-help">
              Orbital inclination in degrees.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="duration">
              Mission Duration
            </label>

            <input
              id="duration"
              name="duration"
              type="number"
              value={mission.duration}
              onChange={handleChange}
              placeholder="365"
              min="1"
              max="3650"
              step="1"
              required
            />

            <p className="form-help">
              Planned mission duration in days (1–3650).
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading
                ? "Creating Mission..."
                : "Create Mission"}
            </button>

            <Link
              to="/"
              className="button button-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreateMission;
