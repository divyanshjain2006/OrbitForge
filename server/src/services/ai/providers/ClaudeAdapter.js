import { ProviderAdapter } from "./ProviderAdapter.js";

export class ClaudeAdapter extends ProviderAdapter {
  constructor(model, apiKey) {
    super(model);
    this.apiKey = apiKey;
  }

  async structuredGenerate(systemPrompt, userPrompt) {
    if (!this.apiKey) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    const payload = {
      model: this.model,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4096,
      tools: [
        {
          name: "orbitforge_response",
          description: "Respond with the structured OrbitForge format",
          input_schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              reasoningSummary: { type: "string" },
              scientificCaveats: { type: "string" }
            },
            required: ["answer", "reasoningSummary", "scientificCaveats"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "orbitforge_response" }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorText = "";
        try {
          const errBody = await response.json();
          errorText = errBody.error?.message || JSON.stringify(errBody);
        } catch {
          errorText = response.statusText;
        }
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const toolCall = data.content?.find(c => c.type === "tool_use" && c.name === "orbitforge_response");
      if (!toolCall || !toolCall.input) {
        throw new Error("Malformed provider response: no structured tool call returned");
      }

      return toolCall.input;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Provider timeout");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
