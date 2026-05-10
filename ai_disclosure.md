# AI Disclosure — InciWatch

This document describes how AI is used in this repository, both at runtime (in the demo app) and during development of project artifacts.

## 1) Runtime AI usage (in-app)

InciWatch uses an LLM at runtime to help match new alerts against historical incidents.

### What happens

- The UI submits an alert to the backend endpoint `POST /api/alert`.
- The backend loads historical incidents from `incidents.yaml`.
- The backend constructs a prompt that includes:
  - The new alert details (`alert_text`, `severity`, `service`)
  - The full incident history serialized as YAML
- The backend calls Groq’s OpenAI-compatible Chat Completions API (`https://api.groq.com/openai/v1/chat/completions`).
- The backend requests a strict JSON response (`response_format: { type: 'json_object' }`).
- The UI renders the returned matches (top similar incidents + suggested resolver and estimate).

### Model

- The backend currently configures the model as `llama-3.3-70b-versatile`.

### Data sent to the model

- The new alert content you submit from the UI.
- The contents of `incidents.yaml` (the “incident memory”).

If you run this demo with real incident data, assume that any text present in `incidents.yaml` and any alert text you submit may be transmitted to the LLM provider.

### Limitations and safe-use notes

- LLM output can be incorrect, inconsistent, or misleading.
- Similarity scores and “confidence” values are model-generated and not guaranteed.
- Treat results as suggestions; validate before taking action.
- This project is a demo/proof-of-concept and is not a substitute for production-grade incident response processes.

## 2) Dev-time AI usage (authoring)

GitHub Copilot (using GPT-5.2) was used to help draft/edit documentation for this repository, including the project README and this disclosure. Changes should be reviewed by a human for correctness and security.

## Contact / Changes

If you update the LLM provider, model name, or what data is sent to the LLM, please update this document to reflect those changes.