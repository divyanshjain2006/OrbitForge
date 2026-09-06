/**
 * VerificationDetail
 *
 * Compact panel that shows the full details of an integrity verification run.
 *
 * Props (all optional — component gracefully handles null/undefined):
 *   result              — "VERIFIED" | "FAILED" | "PENDING" | "NOT_VERIFIED"
 *   algorithm           — string  e.g. "SHA-256"
 *   canonicalizationVersion — string e.g. "1.0"
 *   computedHash        — string  hex digest computed at verification time
 *   storedHash          — string  hex digest stored with the record
 *   verifiedAt          — string  ISO timestamp
 *   tamperExplanation   — string  shown only when result is FAILED
 */

import IntegrityBadge from "./IntegrityBadge";


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
    second: "2-digit",
    timeZoneName: "short"
  });
}

function MetaField({ label, children }) {
  return (
    <div className="verification-detail__field">
      <span className="verification-detail__label">
        {label}
      </span>
      <span className="verification-detail__value">
        {children}
      </span>
    </div>
  );
}

function VerificationDetail({
  result,
  algorithm,
  canonicalizationVersion,
  computedHash,
  storedHash,
  verifiedAt,
  tamperExplanation
}) {
  const hasAnyData =
    result || algorithm || computedHash || storedHash || verifiedAt;

  const hashesMatch =
    computedHash &&
    storedHash &&
    computedHash.toLowerCase() === storedHash.toLowerCase();

  const verifiedAtFormatted = formatTimestamp(verifiedAt);

  return (
    <div className="verification-detail">
      <div className="verification-detail__header">
        <span className="verification-detail__title">
          Integrity Verification
        </span>

        <IntegrityBadge status={result || "NOT_VERIFIED"} />
      </div>

      {!hasAnyData ? (
        <div className="verification-detail--empty">
          Verification data not yet available.
        </div>
      ) : (
        <>
          {/* Scalar metadata */}
          <div className="verification-detail__grid">
            {algorithm && (
              <MetaField label="Algorithm">
                {algorithm}
              </MetaField>
            )}

            {canonicalizationVersion && (
              <MetaField label="Canonicalization">
                v{canonicalizationVersion}
              </MetaField>
            )}

            {verifiedAtFormatted && (
              <MetaField label="Verified At">
                {verifiedAtFormatted}
              </MetaField>
            )}
          </div>

          {/* Hash comparison */}
          {(computedHash || storedHash) && (
            <div className="verification-detail__hash-row">
              <span className="verification-detail__hash-row-label">
                Digest Comparison
              </span>

              {storedHash && (
                <div className="verification-detail__field">
                  <span className="verification-detail__label">
                    Stored SHA-256
                  </span>
                  <span
                    className="verification-detail__value verification-detail__value--mono"
                    title={storedHash}
                  >
                    {storedHash}
                  </span>
                </div>
              )}

              {computedHash && (
                <div className="verification-detail__field">
                  <span className="verification-detail__label">
                    Computed SHA-256
                  </span>
                  <span
                    className={`verification-detail__value verification-detail__value--mono ${
                      computedHash && storedHash
                        ? hashesMatch
                          ? "verification-detail__value--match"
                          : "verification-detail__value--mismatch"
                        : ""
                    }`}
                    title={computedHash}
                  >
                    {computedHash}
                  </span>
                </div>
              )}

              {computedHash && storedHash && (
                <div className="verification-detail__field">
                  <span className="verification-detail__label">
                    Match
                  </span>
                  <span className="verification-detail__value">
                    {hashesMatch
                      ? "✓ Digests match"
                      : "✗ Digests do not match"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tamper / failure explanation */}
          {tamperExplanation && (
            <div className="verification-detail__error">
              <strong>Verification Failure: </strong>
              {tamperExplanation}
            </div>
          )}
        </>
      )}

      {/* Permanent disclaimer — always shown */}
      <div className="verification-detail__disclaimer">
        <span
          className="verification-detail__disclaimer-icon"
          aria-hidden="true"
        >
          ℹ
        </span>
        <p>
          SHA-256 verification confirms that the stored record content matches
          its digest. It does not verify the identity of the record author or
          attest to operational authority.
        </p>
      </div>
    </div>
  );
}

export default VerificationDetail;
