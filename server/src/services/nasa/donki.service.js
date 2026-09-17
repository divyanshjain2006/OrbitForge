import { normalizeDonkiPayload } from "./donki.adapter.js";

const DEFAULT_TIMEOUT_MS = 10000;

export function getDonkiEndpoint() {
  const base = process.env.DONKI_API_BASE_URL || "https://ccmc.gsfc.nasa.gov/DONKI-API/get/";
  const endpoint = new URL("CME", base).toString();
  // We can attach default start/end dates if needed, e.g., ?startDate=yyyy-MM-dd
  return endpoint;
}

export async function fetchDonkiCME(startDate = null, endDate = null) {
  const url = new URL(getDonkiEndpoint());
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "OrbitForge-System/1.0"
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("NASA DONKI API request timed out.");
    }
    throw new Error(`NASA DONKI API network failure: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`NASA DONKI API rejected the request with HTTP ${response.status}`);
  }

  let rawPayload;
  try {
    rawPayload = await response.json();
  } catch {
    throw new Error("NASA DONKI API returned invalid JSON.");
  }

  const normalizedPayload = normalizeDonkiPayload(rawPayload);

  return {
    rawPayload,
    normalizedPayload,
    sourceUri: url.toString(),
    retrievedAt: new Date().toISOString()
  };
}
