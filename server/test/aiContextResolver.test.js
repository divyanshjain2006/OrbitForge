import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatContextForPrompt } from "../src/services/ai/ContextResolver.js";

describe("AI Context Resolver", () => {
  it("formats context correctly", () => {
    const structured = {
      resources: {
        mission: { name: "Test Mission" },
        dataset: { _id: "123", name: "Test Dataset" }
      }
    };
    const text = formatContextForPrompt(structured);
    assert.match(text, /Test Mission/);
    assert.match(text, /Test Dataset/);
    assert.match(text, /ORBITFORGE GOVERNED CONTEXT/);
  });
});
