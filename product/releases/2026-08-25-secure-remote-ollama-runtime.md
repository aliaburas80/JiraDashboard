# 2026-08-25 — Secure remote Ollama runtime preparation

Delivery Clarity's interactive Intelligence provider can now connect safely to a separate self-hosted Ollama server when the production Node application and inference runtime cannot share localhost/private networking.

## What changed

- Added optional server-side `OLLAMA_AUTH_TOKEN` bearer authentication.
- Added a production guard: non-private Ollama endpoints must use HTTPS and a bearer token or the application remains in deterministic Evidence mode.
- Preserved localhost/private-IP Ollama support for same-host/private-network deployments.
- Added `ops/ollama/Caddyfile.example`, exposing only authenticated `POST /api/chat` and keeping the raw Ollama listener on `127.0.0.1:11434`.
- Added a Hostinger VPS deployment runbook at `ops/ollama/README.md`.
- Added unit coverage for private/local endpoints, protected public HTTPS gateways, token headers, and insecure/missing-auth rejection.

## Intended production shape

The current Hostinger Managed Node/Web Apps deployment can remain unchanged. A separate Hostinger VPS runs Ollama and the Qwen models behind the protected HTTPS gateway.

The runtime is not considered live until the VPS is provisioned, both Qwen models are pulled, the production environment variables are saved, and the `/intelligence` verification matrix passes.
