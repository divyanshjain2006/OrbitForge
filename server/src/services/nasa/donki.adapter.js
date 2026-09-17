const ADAPTER_VERSION = "nasa-donki-adapter/1.0";

function numeric(value, field, errors) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    errors.push(`${field} is not finite.`);
    return null;
  }
  return number;
}

export function normalizeDonkiPayload(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("DONKI response does not contain an object collection.");
  }

  const errors = [];
  const objects = payload.map((event) => {
    const activityID = event.activityID || "UNKNOWN";
    if (activityID === "UNKNOWN") errors.push("DONKI event is missing activityID.");

    let primaryAnalysis = null;
    const analyses = Array.isArray(event.cmeAnalyses) ? event.cmeAnalyses : [];
    
    // According to rule 20: prefer "most accurate/prime" analysis, fallback to the latest one or first.
    const mostAccurate = analyses.find(a => a.isMostAccurate);
    if (mostAccurate) {
      primaryAnalysis = mostAccurate;
    } else if (analyses.length > 0) {
      primaryAnalysis = analyses[analyses.length - 1]; // Assume last is newest if not flagged
    }

    return {
      activityID,
      startTime: event.startTime || null,
      catalog: event.catalog || "UNKNOWN",
      note: event.note || "",
      speed: primaryAnalysis ? numeric(primaryAnalysis.speed, "speed", errors) : null,
      halfAngle: primaryAnalysis ? numeric(primaryAnalysis.halfAngle, "halfAngle", errors) : null,
      latitude: primaryAnalysis ? numeric(primaryAnalysis.latitude, "latitude", errors) : null,
      longitude: primaryAnalysis ? numeric(primaryAnalysis.longitude, "longitude", errors) : null,
      type: primaryAnalysis ? primaryAnalysis.type : null,
      isMostAccurate: primaryAnalysis ? Boolean(primaryAnalysis.isMostAccurate) : false,
      time21_5: primaryAnalysis ? primaryAnalysis.time21_5 : null,
      associatedCMEID: primaryAnalysis ? primaryAnalysis.associatedCMEID : null
    };
  });

  if (errors.length > 0) {
    throw new Error(`Malformed DONKI response: ${errors.join(" ")}`);
  }

  return {
    schema: "orbitforge.nasa-donki/1.0",
    adapterVersion: ADAPTER_VERSION,
    objects
  };
}

export { ADAPTER_VERSION };
