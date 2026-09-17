import { describe, it } from "node:test";
import assert from "node:assert";
import { processAiRequest } from "../src/services/ai/AiGateway.js";
import { getRoleConfig, AI_ROLES } from "../src/services/ai/AiRoleConfig.js";
import { ProviderAdapter } from "../src/services/ai/providers/ProviderAdapter.js";
import { OpenAiAdapter } from "../src/services/ai/providers/OpenAiAdapter.js";

describe("AI Gateway and Configuration", () => {
  it("resolves role configuration", () => {
    const config = getRoleConfig("SCIENTIFIC_EXPLAINER");
    assert.ok(config);
    assert.strictEqual(config.provider, process.env.SCIENTIFIC_EXPLAINER_PROVIDER || "openai");
  });

  it("returns null for unknown role", () => {
    const config = getRoleConfig("UNKNOWN_ROLE");
    assert.strictEqual(config, null);
  });

  it("ProviderAdapter throws on unimplemented method", async () => {
    const adapter = new ProviderAdapter("model");
    await assert.rejects(
      () => adapter.structuredGenerate("system", "user"),
      /not implemented/
    );
  });
});
