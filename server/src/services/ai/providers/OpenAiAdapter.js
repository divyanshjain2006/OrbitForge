import { ProviderAdapter } from "./ProviderAdapter.js";

export class OpenAiAdapter extends ProviderAdapter {
  async structuredGenerate(systemPrompt, userPrompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "orbitforge_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              reasoningSummary: { type: "string" },
              scientificCaveats: { type: "string" }
            },
            required: ["answer", "reasoningSummary", "scientificCaveats"],
            additionalProperties: false
          }
        }
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
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
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Malformed provider response: no content returned");
      }

      return JSON.parse(content);
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
