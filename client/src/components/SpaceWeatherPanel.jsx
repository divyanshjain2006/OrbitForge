import "./SpaceWeatherPanel.css";

export default function SpaceWeatherPanel({ className = "" }) {
  return (
    <section className={`space-weather-panel ${className}`}>
      <div className="space-weather-panel__header">
        <span className="space-weather-panel__kicker">SPACE WEATHER CONTEXT</span>
        <h3 className="space-weather-panel__title">NASA CCMC DONKI</h3>
      </div>
      <div className="space-weather-panel__content">
        <div className="space-weather-panel__row">
          <span className="space-weather-panel__label">Source Data</span>
          <span className="space-weather-panel__value">Coronal Mass Ejection (CME)</span>
        </div>
        <div className="space-weather-panel__row">
          <span className="space-weather-panel__label">Validation</span>
          <span className="space-weather-panel__badge space-weather-panel__badge--valid">VALID</span>
        </div>
        <div className="space-weather-panel__divider" />
        <div className="space-weather-panel__row">
          <span className="space-weather-panel__label">Derived Result</span>
          <span className="space-weather-panel__value">ORBITFORGE MODELED RESULT</span>
        </div>
        <div className="space-weather-panel__row">
          <span className="space-weather-panel__label">Model</span>
          <span className="space-weather-panel__value">Space Weather Model v1.0.0</span>
        </div>
      </div>
      <div className="space-weather-panel__footer">
        <p>OrbitForge models are for demonstrative simulation only. Do not use for real spacecraft operations.</p>
      </div>
    </section>
  );
}
