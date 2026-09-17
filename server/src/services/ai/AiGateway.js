import AiInteraction from "../../models/aiInteraction.model.js";
import AiRoleConfigDb from "../../models/aiRoleConfig.model.js";
import AiProviderDb from "../../models/aiProvider.model.js";
import { getRoleConfig as getServerRoleConfig, AI_ROLES } from "./AiRoleConfig.js";
import { decryptSecret } from "../../utils/crypto.js";
import { resolveAiContext, formatContextForPrompt } from "./ContextResolver.js";
import { OpenAiAdapter } from "./providers/OpenAiAdapter.js";
import { GeminiAdapter } from "./providers/GeminiAdapter.js";
import { ClaudeAdapter } from "./providers/ClaudeAdapter.js";
import { OpenRouterAdapter } from "./providers/OpenRouterAdapter.js";

function getAdapter(provider, model, apiKey) {
  switch (provider.toLowerCase()) {
    case "openai":
      return new OpenAiAdapter(model, apiKey);
    case "gemini":
      return new GeminiAdapter(model, apiKey);
    case "claude":
      return new ClaudeAdapter(model, apiKey);
    case "openrouter":
      return new OpenRouterAdapter(model, apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function getSystemPrompt(role) {
  const baseRules = `
You are an intelligent reasoning layer for OrbitForge, an interactive space-mission laboratory.
CRITICAL RULES:
1. MODEL != MEASUREMENT: Always distinguish between a modeled calculation and a live measurement.
2. HEURISTIC != PROBABILITY: A heuristic risk score is not a probability percent. Do not invent statistical confidence.
3. SIMULATION != REAL EVENT: A scenario simulation is hypothetical, not a real physical event.
4. AI SUGGESTION != SCIENTIFIC FACT: You are interpreting data, not generating scientific truth.
5. PRESERVE LIMITATIONS: Explicitly state known assumptions and limitations provided in the context.
You must return a strict JSON output matching the required schema.
`;

  switch (role) {
    case "SCIENTIFIC_EXPLAINER":
      return baseRules + "\nYour specific role is to explain deterministic scientific outputs and research records in accessible language. Ground your explanation entirely in the provided OrbitForge context.";
    case "RESEARCH_ASSISTANT":
      return baseRules + "\nYour specific role is to help users understand research artifacts, summarize experiments, and trace provenance. Ground your response entirely in the provided OrbitForge context.";
    case "MISSION_ANALYST":
      return baseRules + "\nYour specific role is to analyze an existing mission using OrbitForge's governed scientific context. Explain the configuration, orbital characteristics, and risk factors.";
    default:
      return baseRules + "\nAnalyze the provided context and answer the user's query.";
  }
}

export async function processAiRequest(workspaceId, userId, role, contextRefs, userPrompt = "") {
  // 1. Resolve role config
  let provider = null;
  let model = null;
  let apiKey = null;

  // Check valid role
  if (!AI_ROLES[role]) {
    throw new Error(`Invalid or inactive AI role: ${role}`);
  }

  const userRoleConfig = await AiRoleConfigDb.findOne({ userId, role }).lean();
  if (userRoleConfig) {
    // User explicitly configured this role
    provider = userRoleConfig.provider;
    model = userRoleConfig.model;
    
    const userProvider = await AiProviderDb.findOne({ userId, provider }).lean();
    if (!userProvider) {
      throw new Error("AI Provider Not Configured: The configured provider is not connected.");
    }
    
    apiKey = decryptSecret(userProvider);
  } else {
    // Fall back to server environment
    const serverConfig = getServerRoleConfig(role);
    if (!serverConfig) {
      throw new Error("AI Provider Not Configured");
    }
    provider = serverConfig.provider;
    model = serverConfig.model;
    
    if (provider === "openai") apiKey = process.env.OPENAI_API_KEY;
    else if (provider === "gemini") apiKey = process.env.GEMINI_API_KEY;
    else if (provider === "claude") apiKey = process.env.CLAUDE_API_KEY;
    else if (provider === "openrouter") apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("AI Provider Not Configured");
    }
  }

  // 2. Initialize Interaction
  const interaction = new AiInteraction({
    workspaceId,
    userId,
    role,
    provider,
    model,
    contextReferences: contextRefs,
    status: "FAILED"
  });

  try {
    // 3. Resolve Authorized Context
    let structuredContext;
    try {
      structuredContext = await resolveAiContext(workspaceId, contextRefs);
    } catch (err) {
      if (err.message.startsWith("UNAUTHORIZED_OR_MISSING")) {
        interaction.status = "UNAUTHORIZED";
        interaction.errorInformation = err.message;
        await interaction.save();
        throw err; // Re-throw so controller handles it as 403/404
      }
      throw err;
    }

    const contextText = formatContextForPrompt(structuredContext);
    
    // 4. Construct Prompts
    const systemPrompt = getSystemPrompt(role);
    const finalUserPrompt = `${contextText}\n\nUSER PROMPT:\n${userPrompt || "Please explain this context."}`;

    // 5. Invoke Provider
    const adapter = getAdapter(provider, model, apiKey);
    
    const startTime = Date.now();
    let result;
    try {
      result = await adapter.structuredGenerate(systemPrompt, finalUserPrompt);
    } catch (providerError) {
      interaction.status = providerError.message.includes("timeout") ? "TIMEOUT" : "FAILED";
      interaction.errorInformation = providerError.message;
      interaction.latencyMs = Date.now() - startTime;
      await interaction.save();
      throw providerError;
    }
    const latency = Date.now() - startTime;

    // 6. Save Success
    const sanitize = (str) => typeof str === "string" ? str.replace(/</g, "&lt;").replace(/>/g, "&gt;") : str;
    interaction.answer = sanitize(result.answer);
    interaction.reasoningSummary = sanitize(result.reasoningSummary);
    interaction.scientificCaveats = sanitize(result.scientificCaveats);
    interaction.status = "SUCCESS";
    interaction.latencyMs = latency;
    await interaction.save();

    // 7. Format Result
    return {
      success: true,
      role,
      provider,
      model,
      answer: result.answer,
      reasoningSummary: result.reasoningSummary,
      scientificCaveats: result.scientificCaveats,
      contextReferences: Object.keys(structuredContext.resources), // List populated entities
      generatedAt: interaction.createdAt,
      interactionId: interaction._id
    };
  } catch (error) {
    if (!interaction._id) {
      // Failed before save could happen
      console.error("AI Gateway fatal error:", error);
    }
    throw error;
  }
}
