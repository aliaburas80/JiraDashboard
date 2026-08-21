# Release Note — Self-Hosted Qwen Intelligence

**Date:** 2026-08-21  
**Area:** Delivery Intelligence  
**Impact:** User-facing AI provider behavior and deployment configuration

Delivery Intelligence has been aligned with the product's canonical free/self-hosted AI plan.

- Removed the paid OpenAI API dependency from the Delivery Intelligence provider path.
- Added private Ollama integration using `qwen3.5:4b` and `qwen3.5:9b`.
- Flow and Risk use the fast 4b model; Executive and Forecast prefer the stronger 9b model.
- Executive and Forecast automatically retry on the 4b model if 9b is unavailable.
- Structured JSON-schema output, prompt-injection separation, safe action links, bounded evidence input, rate limiting, and deterministic Evidence-mode fallback remain enforced.
- The original Jira export is not sent to the model; only the bounded Delivery Intelligence evidence snapshot is used.
- No API key is required. The Ollama runtime must be privately provisioned and reachable by the server.

Production AI should not be considered live until both Qwen models are pulled on the real inference host and `/intelligence` is verified to display the expected model for both fast and deep specialist paths. The application continues to work in Evidence mode without Ollama.
