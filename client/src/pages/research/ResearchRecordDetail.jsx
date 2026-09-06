/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getResearchRecord, getResearchRecordProvenance, verifyResearchRecord, getVerificationHistory } from "../../services/api";
import { IntegrityBadge, ResearchRecordPanel, ProvenanceChain } from "../../components/trust";
import { RoleGuard } from "../../components/RoleGuard";
import JsonViewer from "../../components/JsonViewer";

export default function ResearchRecordDetail() {
  const { recordId } = useParams();
  const [researchRecord, setResearchRecord] = useState(null);
  const [integrityManifest, setIntegrityManifest] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [provenance, setProvenance] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  const fetchRecordDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend: GET /api/v1/research-records/:id
      // Returns: { success, researchRecord, integrityManifest, integrity }
      const recordData = await getResearchRecord(recordId);
      if (recordData.success && recordData.researchRecord) {
        setResearchRecord(recordData.researchRecord);
        setIntegrityManifest(recordData.integrityManifest || null);
        setIntegrity(recordData.integrity || null);
      } else {
        throw new Error("Invalid record response format");
      }

      // Backend: GET /api/v1/research-records/:id/provenance
      // Returns: { success, provenance: { researchRecordId, artifactType, provenance, semanticPayload } }
      try {
        const provData = await getResearchRecordProvenance(recordId);
        if (provData.success && provData.provenance) {
          setProvenance(provData.provenance);
        }
      } catch {
        // Provenance may not be available for all records
      }

      // Backend: GET /api/v1/research-records/:id/verifications
      // Returns: { success, verifications: [...] }
      try {
        const verifData = await getVerificationHistory(recordId);
        if (verifData.success && verifData.verifications) {
          setVerifications(verifData.verifications);
        }
      } catch {
        // Verification history may be empty
      }
    } catch (err) {
      setError(err.message || "Failed to fetch research record details");
    } finally {
      setIsLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    fetchRecordDetails();
  }, [fetchRecordDetails]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      // Backend: POST /api/v1/research-records/:id/verify
      // Returns: { success, verification: { ...event }, integrityManifest }
      const result = await verifyResearchRecord(recordId);
      if (result.success) {
        // Refresh the full record to get updated integrity status
        await fetchRecordDetails();
      }
    } catch (err) {
      setVerifyError(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) return <div className="loading-state">Loading research record...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!researchRecord) return <div className="error-state">Research record not found</div>;

  // Determine the integrity status from backend response
  const integrityStatus = integrity?.status || "UNAVAILABLE";

  // Build verification detail from the latest verification event
  const latestVerification = verifications.length > 0 ? verifications[0] : null;
  const verificationProps = latestVerification ? {
    result: latestVerification.result,
    algorithm: latestVerification.algorithm,
    computedHash: latestVerification.computedHash,
    storedHash: latestVerification.expectedHash,
    verifiedAt: latestVerification.verifiedAt,
    canonicalizationVersion: latestVerification.canonicalizationVersion
  } : null;

  return (
    <div className="research-page research-record-detail">
      <div style={{ marginBottom: "1rem" }}>
        {researchRecord.experimentRunId && (
          <Link to={`/research/runs/${researchRecord.experimentRunId}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← Back to Run</Link>
        )}
      </div>

      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0" }}>Research Record</h1>
          <p style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "0.85rem" }}>ID: {researchRecord.id || researchRecord._id}</p>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              {researchRecord.artifactType}
            </span>
            <IntegrityBadge status={integrityStatus} />
          </div>
        </div>

        <RoleGuard allowedRoles={["OWNER", "ADMIN", "RESEARCHER"]}>
          <button
            onClick={handleVerify}
            disabled={isVerifying || integrityStatus === "UNAVAILABLE"}
            className="action-button primary"
            style={{ padding: "0.5rem 1rem", borderRadius: "4px" }}
          >
            {isVerifying ? "Verifying..." : "Verify Integrity"}
          </button>
        </RoleGuard>
      </header>

      {verifyError && (
        <div style={{
          padding: "1rem",
          marginBottom: "1.5rem",
          borderRadius: "4px",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          border: "1px solid var(--status-danger)",
          color: "var(--status-danger)"
        }}>
          {verifyError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Integrity & Verification Section */}
        <ResearchRecordPanel
          recordId={researchRecord.id || researchRecord._id}
          missionId={researchRecord.missionId}
          analysisRunId={researchRecord.analysisRunId}
          createdAt={researchRecord.createdAt}
          canonicalizationVersion={researchRecord.canonicalizationVersion}
          integrityStatus={integrityStatus}
          verification={verificationProps}
        />

        {/* Provenance Chain */}
        <ProvenanceChain
          analysisRunId={researchRecord.analysisRunId}
          canonicalizationVersion={researchRecord.canonicalizationVersion}
          integrityHash={integrityManifest?.digest || integrity?.digest}
          verificationStatus={integrityStatus}
        />
      </div>

      {/* Manifest Details */}
      {integrityManifest && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Integrity Manifest</h3>
          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
              <div><strong style={{ color: "var(--text-secondary)" }}>Algorithm:</strong> {integrityManifest.algorithm}</div>
              <div><strong style={{ color: "var(--text-secondary)" }}>Canonicalization:</strong> v{integrityManifest.canonicalizationVersion}</div>
              <div style={{ gridColumn: "1 / -1" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Digest:</strong>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", marginLeft: "0.5rem", wordBreak: "break-all" }}>{integrityManifest.digest}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Verification History */}
      {verifications.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Verification History ({verifications.length} event{verifications.length !== 1 ? "s" : ""})</h3>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-panel)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Result</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Algorithm</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Verified At</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Expected Hash</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Computed Hash</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((event) => (
                  <tr key={event.id || event._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <IntegrityBadge status={event.result} compact />
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{event.algorithm}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{new Date(event.verifiedAt).toLocaleString()}</td>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.8rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }} title={event.expectedHash}>{event.expectedHash}</td>
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.8rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }} title={event.computedHash}>{event.computedHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Semantic Payload */}
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Semantic Payload</h3>
        <JsonViewer data={researchRecord.semanticPayload} />
      </section>

      {/* Raw Provenance */}
      {provenance && provenance.provenance && (
        <section>
          <h3 style={{ marginBottom: "1rem" }}>Provenance Data</h3>
          <JsonViewer data={provenance.provenance} />
        </section>
      )}
    </div>
  );
}
