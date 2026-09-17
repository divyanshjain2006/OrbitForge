export class ProviderAdapter {
  constructor(model) {
    this.model = model;
  }

  /**
   * Must return { answer, reasoningSummary, scientificCaveats }
   */
  async structuredGenerate(systemPrompt, userPrompt) {
    throw new Error("structuredGenerate not implemented by provider");
  }
}
