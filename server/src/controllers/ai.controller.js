import { processAiRequest } from "../services/ai/AiGateway.js";

export async function analyze(req, res) {
  console.log("REACHED ANALYZE ROUTE", req.body);
  try {
    const { role, contextRefs, userPrompt } = req.body;
    const workspaceId = req.workspaceId; // Available from workspaceAuth middleware
    const userId = req.auth.userId;

    if (!role || !contextRefs) {
      return res.status(400).json({
        success: false,
        message: "Missing 'role' or 'contextRefs' in request body"
      });
    }

    const result = await processAiRequest(workspaceId, userId, role, contextRefs, userPrompt);
    return res.json(result);
  } catch (error) {
    if (error.message.startsWith("UNAUTHORIZED_OR_MISSING")) {
      return res.status(404).json({
        success: false,
        message: "Referenced context resource not found or unauthorized in this workspace"
      });
    }

    if (error.code === "INVALID_ROLE" || error.message.includes("Invalid or inactive AI role")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === "CONFIG_MISSING" || error.message.includes("AI Provider Not Configured")) {
      return res.status(400).json({
        success: false,
        message: "AI Provider is not fully configured.",
        details: error.message
      });
    }
    
    if (error.message.includes("API error") || error.message.includes("timeout") || error.message.includes("Malformed provider response")) {
      console.error("Upstream AI Provider failure:", error);
      return res.status(502).json({
        success: false,
        message: "Upstream AI Provider failure",
        details: error.message
      });
    }

    console.error("AI Analysis unexpected failure:", error);
    
    return res.status(500).json({
      success: false,
      message: "AI Service encountered an unexpected error.",
      details: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"
    });
  }
}
