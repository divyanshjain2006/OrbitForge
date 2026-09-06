/**
 * IntegrityBadge
 *
 * Displays the SHA-256 integrity verification state of a research record.
 *
 * IMPORTANT — Language policy:
 *   "VERIFIED" means: the record content matches its stored SHA-256 digest.
 *   It does NOT mean: "NASA verified this record" or "authenticated by anyone".
 *   Authenticity and authorship are separate concerns not represented here.
 *
 * Props:
 *   status   — "VERIFIED" | "FAILED" | "PENDING" | "NOT_VERIFIED" | "UNAVAILABLE" (default)
 *   showCaption — boolean, whether to show the explanatory caption below
 *   compact  — boolean, smaller display without caption slot
 */

const STATUS_CONFIG = {
  VERIFIED: {
    icon: "✓",
    label: "INTEGRITY VERIFIED",
    caption:
      "Record content matches its stored SHA-256 digest.",
    modifier: "verified"
  },
  FAILED: {
    icon: "✗",
    label: "VERIFICATION FAILED",
    caption:
      "The computed SHA-256 digest does not match the stored value. The record may have been modified.",
    modifier: "failed"
  },
  PENDING: {
    icon: "◌",
    label: "VERIFICATION PENDING",
    caption:
      "Integrity verification has not yet been computed for this record.",
    modifier: "pending"
  },
  NOT_VERIFIED: {
    icon: "–",
    label: "NOT VERIFIED",
    caption:
      "No integrity verification has been performed on this record.",
    modifier: "not-verified"
  },
  UNAVAILABLE: {
    icon: "∅",
    label: "UNAVAILABLE",
    caption:
      "Trust record pending backend implementation. Record does not exist yet.",
    modifier: "unavailable"
  }
};

function IntegrityBadge({
  status = "UNAVAILABLE",
  showCaption = false,
  compact = false
}) {
  const normalized = String(status).toUpperCase();
  const config =
    STATUS_CONFIG[normalized] || STATUS_CONFIG.UNAVAILABLE;

  return (
    <span>
      <span
        className={`integrity-badge integrity-badge--${config.modifier}`}
        role="status"
        aria-label={config.caption}
      >
        <span
          className="integrity-badge__icon"
          aria-hidden="true"
        >
          {config.icon}
        </span>
        {config.label}
      </span>

      {showCaption && !compact && (
        <span className="integrity-badge__caption">
          {config.caption}
        </span>
      )}
    </span>
  );
}

export default IntegrityBadge;
