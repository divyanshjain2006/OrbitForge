/**
 * ResearchRecordPanel
 *
 * Displays research record metadata, integrity status, and verification detail
 * for a mission analysis.
 *
 * All props are optional. The component renders gracefully when no backend data
 * is available yet (Milestone 1A backend dependency).
 *
 * Props:
 *   recordId                — string | null
 *   missionId               — string | null
 *   missionName             — string | null
 *   analysisRunId           — string | null
 *   createdAt               — string | null   ISO timestamp
 *   evaluatedAt             — string | null   ISO timestamp
 *   modelVersion            — string | null
 *   canonicalizationVersion — string | null
 *   provenanceNote          — string | null
 *   integrityStatus         — "VERIFIED" | "FAILED" | "PENDING" | "NOT_VERIFIED" | "UNAVAILABLE"
 *   verification            — object | null   (passed to VerificationDetail)
 */

import IntegrityBadge from "./IntegrityBadge";
import VerificationDetail from "./VerificationDetail";

function formatTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

function MetaItem({ label, value, mono = false }) {
  const isEmpty = value == null || value === "";

  return (
    <div className="research-record-panel__meta-item">
      <span className="research-record-panel__meta-label">
        {label}
      </span>

      <span
        className={`research-record-panel__meta-value ${
          mono ? "research-record-panel__meta-value--mono" : ""
        } ${
          isEmpty ? "research-record-panel__meta-value--empty" : ""
        }`}
      >
        {isEmpty ? "—" : value}
      </span>
    </div>
  );
}

function ResearchRecordPanel({
  recordId,
  missionId,
  missionName,
  analysisRunId,
  createdAt,
  evaluatedAt,
  modelVersion,
  canonicalizationVersion,
  provenanceNote,
  integrityStatus = "UNAVAILABLE",
  verification
}) {
  const createdAtFormatted = formatTimestamp(createdAt);
  const evaluatedAtFormatted = formatTimestamp(evaluatedAt);

  const hasVerificationData =
    verification &&
    (verification.result ||
      verification.computedHash ||
      verification.storedHash);

  return (
    <div className="research-record-panel">
      {/* ---- Header ---- */}
      <div className="research-record-panel__header">
        <div className="research-record-panel__titles">
          <span className="research-record-panel__kicker">
            Research Record
          </span>

          <h3 className="research-record-panel__heading">
            {missionName || "Mission Research Record"}
          </h3>

          {recordId && (
            <span className="research-record-panel__id">
              REC-ID: {recordId}
            </span>
          )}
        </div>

        <IntegrityBadge status={integrityStatus} />
      </div>

      {/* ---- Metadata grid ---- */}
      <div className="research-record-panel__meta-grid">
        <MetaItem
          label="Mission"
          value={missionName}
        />

        <MetaItem
          label="Mission ID"
          value={missionId}
          mono
        />

        <MetaItem
          label="Analysis Run"
          value={analysisRunId}
          mono
        />

        <MetaItem
          label="Created"
          value={createdAtFormatted}
        />

        <MetaItem
          label="Evaluated"
          value={evaluatedAtFormatted}
        />

        <MetaItem
          label="Model Version"
          value={modelVersion ? `v${modelVersion}` : null}
        />

        <MetaItem
          label="Canonicalization"
          value={
            canonicalizationVersion
              ? `v${canonicalizationVersion}`
              : null
          }
        />

        {provenanceNote && (
          <MetaItem
            label="Provenance"
            value={provenanceNote}
          />
        )}
      </div>

      {/* ---- Integrity / Verification ---- */}
      <div className="research-record-panel__verification">
        <div className="research-record-panel__verification-header">
          <span className="research-record-panel__verification-label">
            Integrity Status
          </span>

          <IntegrityBadge
            status={integrityStatus}
            showCaption={false}
          />
        </div>

        {hasVerificationData ? (
          <VerificationDetail
            result={verification.result}
            algorithm={verification.algorithm}
            canonicalizationVersion={verification.canonicalizationVersion}
            computedHash={verification.computedHash}
            storedHash={verification.storedHash}
            verifiedAt={verification.verifiedAt}
            tamperExplanation={verification.tamperExplanation}
          />
        ) : (
          <div className="research-record-panel__pending-notice">
            <span
              className="research-record-panel__pending-icon"
              aria-hidden="true"
            >
              ◌
            </span>

            <div className="research-record-panel__pending-text">
              <strong>
                Verification Not Yet Available
              </strong>

              <p>
                Research record persistence and SHA-256 integrity verification
                are planned for a future backend milestone. When available,
                the verification result, algorithm, and digest comparison will
                appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResearchRecordPanel;
