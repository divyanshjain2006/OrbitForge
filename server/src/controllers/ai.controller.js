import { processAiRequest } from "../services/ai/AiGateway.js";

export async function analyze(req, res) {
  try {
    const { role, contextRefs, userPrompt } = req.body;
    const workspaceId = req.workspace._id; // Available from workspaceAuth middleware
    const userId = req.user._id;

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

    if (error.message.includes("Invalid or inactive AI role")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error("AI Analysis failed:", error);
    
    // Provide a normalized AI error
    return res.status(500).json({
      success: false,
      message: "AI Provider failure",
      details: error.message
    });
  }
}
