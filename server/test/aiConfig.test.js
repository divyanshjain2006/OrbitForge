import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "../src/utils/crypto.js";
import { addProvider, getProviders, updateRole } from "../src/controllers/aiConfig.controller.js";
import AiProviderDb from "../src/models/aiProvider.model.js";
import AiRoleConfigDb from "../src/models/aiRoleConfig.model.js";
import { processAiRequest } from "../src/services/ai/AiGateway.js";

process.env.AI_CREDENTIAL_SECRET = "01234567890123456789012345678901";

test("AES-256-GCM encryption and decryption works correctly", () => {
  const secret = "my-super-secret-api-key";
  const encrypted = encryptSecret(secret);
  
  assert.equal(typeof encrypted.encryptedKey, "string");
  assert.equal(typeof encrypted.iv, "string");
  assert.equal(typeof encrypted.authTag, "string");
  assert.equal(encrypted.encryptionVersion, 1);
  assert.notEqual(encrypted.encryptedKey, secret);
  
  const decrypted = decryptSecret(encrypted);
  assert.equal(decrypted, secret);
});

test("addProvider encrypts the API key before saving", async () => {
  const originalFindOneAndUpdate = AiProviderDb.findOneAndUpdate;
  let savedData = null;
  AiProviderDb.findOneAndUpdate = async (filter, update, options) => {
    savedData = update;
    return { ...filter, ...update };
  };

  try {
    const req = {
      user: { _id: "user123" },
      body: { provider: "gemini", apiKey: "plaintext-key" }
    };
    let responseBody = null;
    let statusCode = null;
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { responseBody = body; return this; }
    };

    await addProvider(req, res);

    assert.equal(statusCode, 201);
    assert.equal(responseBody.success, true);
    
    assert.ok(savedData.encryptedKey);
    assert.notEqual(savedData.encryptedKey, "plaintext-key");
    assert.ok(savedData.iv);
    assert.ok(savedData.authTag);
  } finally {
    AiProviderDb.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
