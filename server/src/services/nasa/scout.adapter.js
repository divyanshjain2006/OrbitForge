const ADAPTER_VERSION = "cneos-scout-adapter/1.0";

function numeric(value, field, errors) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) { errors.push(`${field} is not finite.`); return null; }
  return number;
}

function sourceRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload && typeof payload === "object") {
    const values = Object.values(payload).filter((value) => value && typeof value === "object" && !Array.isArray(value));
    if (values.some((value) => typeof value.objectName === "string" || typeof value.des === "string")) return values;
  }
  throw new Error("Scout response does not contain an object collection.");
}

export function normalizeScoutPayload(payload) {
  const records = sourceRecords(payload);
  const errors = [];
  const objects = records.map((record) => {
    const designation = String(record.objectName ?? record.des ?? "").trim();
    if (!designation) errors.push("Scout object is missing a designation.");
    return {
      designation,
      observationCount: numeric(record.nObs, "nObs", errors),
      arcHours: numeric(record.arc, "arc", errors),
      impactRating: numeric(record.rating, "rating", errors),
      neoScore: numeric(record.neoScore, "neoScore", errors),
      phaScore: numeric(record.phaScore, "phaScore", errors),
      lastRun: typeof record.lastRun === "string" ? record.lastRun : null,
      ephemerisTime: typeof record.tEphem === "string" ? record.tEphem : null
    };
  });
  if (errors.length) throw new Error(`Malformed Scout response: ${errors.join(" ")}`);
  return { schema: "orbitforge.cneos-scout/1.0", adapterVersion: ADAPTER_VERSION, objects };
}

export { ADAPTER_VERSION };
