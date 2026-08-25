# Delivery Clarity — Hostinger VPS Ollama Runbook

This runbook is for the current production shape where Delivery Clarity stays on Hostinger Managed Node/Web Apps hosting and Ollama runs on a separate Hostinger VPS.

## Target architecture

```text
Browser
  -> https://deliveryclarity.app
  -> Delivery Clarity server-side /api/intelligence/ask
  -> HTTPS + Bearer token
  -> https://ai.deliveryclarity.app/api/chat
  -> Caddy gateway on VPS
  -> http://127.0.0.1:11434/api/chat
  -> Ollama
  -> qwen3.5:4b / qwen3.5:9b
```

The browser never receives `OLLAMA_AUTH_TOKEN`, cannot select the Ollama URL, and cannot call the raw Ollama listener.

## Capacity baseline

Use a VPS with at least:

- 4 CPU cores;
- 16 GB RAM;
- 12 GB+ free disk beyond the OS and application overhead.

Hostinger's current Ollama guidance also uses 16 GB RAM as the baseline. Re-benchmark both configured Qwen models on the actual server before treating this as final production capacity.

## 1. Create the VPS

In Hostinger hPanel:

1. Create/select a VPS with at least the capacity above.
2. Choose the **Ubuntu 24.04 with Ollama** template when available.
3. Keep the VPS patched and record its public IP.
4. Allow inbound TCP `80` and `443` for HTTPS certificate issuance and the protected gateway.
5. Do **not** open TCP `11434` in the VPS firewall.

## 2. Verify Ollama is private

SSH into the VPS and run:

```bash
sudo systemctl status ollama --no-pager
ss -ltnp | grep 11434
```

The desired listener is `127.0.0.1:11434`. Ollama binds to localhost by default. If it was changed to `0.0.0.0`, remove that public bind and restart the service before continuing.

Local verification:

```bash
curl -sS http://127.0.0.1:11434/api/tags
```

## 3. Pull Delivery Clarity models

```bash
ollama pull qwen3.5:4b
ollama pull qwen3.5:9b
ollama list
```

Both model names must appear in `ollama list`.

## 4. Create the protected HTTPS gateway

Create a DNS `A` record for a dedicated hostname such as:

```text
ai.deliveryclarity.app -> <VPS_PUBLIC_IP>
```

Install Caddy on the VPS, then use `ops/ollama/Caddyfile.example` as the gateway configuration. The example intentionally exposes only `POST /api/chat` and strips the bearer token before forwarding the request to local Ollama.

Generate a long token:

```bash
openssl rand -hex 32
```

Store the result securely. Do not commit it to GitHub and do not place it in the browser application.

Configure Caddy's service environment with:

```text
OLLAMA_PUBLIC_HOST=ai.deliveryclarity.app
OLLAMA_AUTH_TOKEN=<generated-secret>
```

For a systemd-managed Caddy installation, one approach is:

```bash
sudo systemctl edit caddy
```

and add:

```ini
[Service]
Environment="OLLAMA_PUBLIC_HOST=ai.deliveryclarity.app"
Environment="OLLAMA_AUTH_TOKEN=<generated-secret>"
```

Then install the example Caddyfile at `/etc/caddy/Caddyfile`, validate it, and restart Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl daemon-reload
sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```

## 5. Verify the gateway security boundary

Without the bearer token, the gateway must not expose Ollama:

```bash
curl -i https://ai.deliveryclarity.app/api/chat
```

Expected: non-success response.

With the token, a chat request should work:

```bash
curl -sS https://ai.deliveryclarity.app/api/chat \
  -H "Authorization: Bearer <generated-secret>" \
  -H 'Content-Type: application/json' \
  --data-raw '{"model":"qwen3.5:4b","messages":[{"role":"user","content":"Reply only with OK"}],"stream":false}'
```

Do not publish or test `http://<VPS_IP>:11434`. Port `11434` remains local-only.

## 6. Configure Delivery Clarity production

In the Hostinger Managed Node/Web Apps environment variables for Delivery Clarity:

```text
OLLAMA_BASE_URL=https://ai.deliveryclarity.app
OLLAMA_AUTH_TOKEN=<same-generated-secret>
OLLAMA_FAST_MODEL=qwen3.5:4b
OLLAMA_DEEP_MODEL=qwen3.5:9b
```

Restart/redeploy the Node application after saving the environment variables.

Production runtime protection in the application rejects a non-private Ollama endpoint unless it uses HTTPS and has `OLLAMA_AUTH_TOKEN`. A rejected/missing runtime falls back to deterministic Evidence mode instead of breaking the Intelligence page.

## 7. End-to-end verification

In `/intelligence`:

| Lens | Expected model |
|---|---|
| Flow & Bottleneck | `qwen3.5:4b` |
| Risk & Quality | `qwen3.5:4b` |
| Executive Briefing | `qwen3.5:9b` |
| Forecast | `qwen3.5:9b` |

For Executive/Forecast, the app retries `qwen3.5:4b` when the 9b model cannot answer safely.

Then temporarily stop Caddy or Ollama and confirm the same request returns `mode: "evidence"` without a 500/error page.

## 8. Rotation and operations

- Rotate `OLLAMA_AUTH_TOKEN` if it is ever disclosed.
- Update the Caddy service environment and Delivery Clarity environment together during rotation.
- Keep `11434` blocked externally.
- Monitor VPS CPU/RAM during representative 4b and 9b requests.
- Re-run the AI benchmark on this VPS; historical Qwen2.5 results are not proof of Qwen3.5 capacity.
