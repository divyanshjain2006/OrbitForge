import { ProviderAdapter } from "./ProviderAdapter.js";

export class GeminiAdapter extends ProviderAdapter {
  async structuredGenerate(systemPrompt, userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            answer: { type: "STRING" },
            reasoningSummary: { type: "STRING" },
            scientificCaveats: { type: "STRING" }
          },
          required: ["answer", "reasoningSummary", "scientificCaveats"]
        }
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
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
