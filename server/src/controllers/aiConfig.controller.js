import AiProviderDb from "../models/aiProvider.model.js";
import AiRoleConfigDb from "../models/aiRoleConfig.model.js";
import { encryptSecret, decryptSecret } from "../utils/crypto.js";
import { AI_ROLES } from "../services/ai/AiRoleConfig.js";

const ALLOWED_PROVIDERS = ["openai", "gemini", "claude", "openrouter"];

export async function getProviders(req, res) {
  try {
    const providers = await AiProviderDb.find({ userId: req.user._id }).lean();
    const masked = providers.map(p => ({
      provider: p.provider,
      connected: true,
      lastTestedAt: p.lastTestedAt,
      createdAt: p.createdAt
    }));
    return res.json({ success: true, providers: masked });
  } catch (err) {
    console.error("Failed to get AI providers", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function addProvider(req, res) {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !ALLOWED_PROVIDERS.includes(provider.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid provider" });
    }
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ success: false, message: "API key is required" });
    }

    const { encryptedKey, iv, authTag, encryptionVersion } = encryptSecret(apiKey);

    await AiProviderDb.findOneAndUpdate(
      { userId: req.user._id, provider: provider.toLowerCase() },
      { encryptedKey, iv, authTag, encryptionVersion },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, message: "Provider connected successfully" });
  } catch (err) {
    console.error("Failed to add AI provider", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function removeProvider(req, res) {
  try {
    const { provider } = req.params;
    await AiProviderDb.findOneAndDelete({ userId: req.user._id, provider: provider.toLowerCase() });
    return res.json({ success: true, message: "Provider removed successfully" });
  } catch (err) {
    console.error("Failed to remove AI provider", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function testProvider(req, res) {
  try {
    const { provider } = req.params;
    const userProvider = await AiProviderDb.findOne({ userId: req.user._id, provider: provider.toLowerCase() });
    if (!userProvider) {
      return res.status(404).json({ success: false, message: "Provider not configured" });
    }

    const apiKey = decryptSecret(userProvider);
    
    // We do a very minimal check depending on provider
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    let ok = false;
    let errMessage = "";

    try {
      if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` },
          signal: controller.signal
        });
        ok = response.ok;
        if (!ok) errMessage = response.statusText;
      } else if (provider === "gemini") {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          signal: controller.signal
        });
        ok = response.ok;
        if (!ok) errMessage = response.statusText;
      } else if (provider === "claude") {
        // Claude doesn't have a simple GET /models yet that is universally available without specific versions
        // We can do a minimal invalid request to check auth
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-3-haiku-20240307", messages: [{role:"user", content:"hi"}], max_tokens: 1 }),
          signal: controller.signal
        });
        ok = response.ok;
        if (!ok) errMessage = response.statusText;
      } else if (provider === "openrouter") {
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { "Authorization": `Bearer ${apiKey}` },
          signal: controller.signal
        });
        ok = response.ok;
        if (!ok) errMessage = response.statusText;
      }

      if (ok) {
        userProvider.lastTestedAt = new Date();
        await userProvider.save();
        return res.json({ success: true, message: "Connection successful" });
      } else {
        return res.status(400).json({ success: false, message: `Connection failed: ${errMessage}` });
      }
    } catch (fetchErr) {
      return res.status(400).json({ success: false, message: "Connection failed: Network error or timeout" });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("Failed to test AI provider", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getRoles(req, res) {
  try {
    const roles = await AiRoleConfigDb.find({ userId: req.user._id }).lean();
    return res.json({ success: true, roles });
  } catch (err) {
    console.error("Failed to get AI roles", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateRole(req, res) {
  try {
    const { role } = req.params;
    const { provider, model } = req.body;

    if (!role || !AI_ROLES[role.toUpperCase()]) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    if (!provider || !ALLOWED_PROVIDERS.includes(provider.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid provider" });
    }
    if (!model || typeof model !== "string") {
      return res.status(400).json({ success: false, message: "Invalid model" });
    }

    // Verify provider is configured
    const userProvider = await AiProviderDb.findOne({ userId: req.user._id, provider: provider.toLowerCase() }).lean();
    if (!userProvider) {
      return res.status(400).json({ success: false, message: "Provider is not connected" });
    }

    const updated = await AiRoleConfigDb.findOneAndUpdate(
      { userId: req.user._id, role: role.toUpperCase() },
      { provider: provider.toLowerCase(), model },
      { upsert: true, new: true }
    ).lean();

    return res.json({ success: true, role: updated });
  } catch (err) {
    console.error("Failed to update AI role", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
