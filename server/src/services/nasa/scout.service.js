import { normalizeScoutPayload, ADAPTER_VERSION } from "./scout.adapter.js";

const DEFAULT_SCOUT_URI = "https://cneos.jpl.nasa.gov/scout.api";
const TIMEOUT_MS = 10000;

export function scoutSourceUri() {
  const configured = process.env.CNEOS_SCOUT_URI || DEFAULT_SCOUT_URI;
  const uri = new URL(configured);
  if (uri.protocol !== "https:" || uri.hostname !== "cneos.jpl.nasa.gov" || uri.pathname !== "/scout.api") throw new Error("CNEOS_SCOUT_URI must use the allowlisted official Scout endpoint.");
  return uri.toString();
}

export async function retrieveScoutPayload({ fetcher = fetch } = {}) {
  const sourceUri = scoutSourceUri();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetcher(sourceUri, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response?.ok) throw new Error(`Scout request failed with HTTP ${response?.status ?? "unknown"}.`);
    let rawPayload;
    try { rawPayload = await response.json(); } catch { throw new Error("Scout response was not valid JSON."); }
    return { sourceUri, rawPayload, normalizedPayload: normalizeScoutPayload(rawPayload), adapterVersion: ADAPTER_VERSION, retrievedAt: new Date() };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Scout request timed out.");
    throw error;
  } finally { clearTimeout(timer); }
}
