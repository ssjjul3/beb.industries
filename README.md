# BEB INDUSTRIES — Command Centre

Personal command centre for $$j3. Powered by Agent_Zero 👾

## Stack
- **Frontend:** HTML/CSS/JS — retro terminal aesthetic, no framework
- **Hosting:** Cloudflare Pages (auto-deploy from this repo)
- **Backend:** Cloudflare Pages Functions (serverless, edge)
- **AI:** OpenClaw gateway → Agent_Zero (claude-sonnet-4-6)
- **Data:** CoinGecko free API (prices), n8n (subagents/research)

## Environment Variables (set in Cloudflare Pages → Settings → Environment Variables)

| Variable | Description |
|----------|-------------|
| `OPENCLAW_URL` | Your Tailscale HTTPS URL e.g. `https://umbrel.tail1234.ts.net:18789` |
| `OPENCLAW_TOKEN` | OpenClaw gateway auth token |
| `N8N_URL` | n8n internal URL e.g. `http://10.21.0.15:5678` |
| `N8N_API_KEY` | n8n API key |
| `RESEARCH_SECRET` | Secret for n8n to push research items |
| `RESEARCH_KV` | (KV Binding) Cloudflare KV namespace for research storage |

## KV Namespace
Create a KV namespace called `RESEARCH_KV` in Cloudflare dashboard and bind it to this Pages project.

## Pages Functions
- `GET /chat` (POST) — proxies chat to OpenClaw
- `GET /subagents` — returns live n8n workflow status
- `GET /research` — returns research items from KV
- `POST /research` — n8n pushes new research items here

## Getting OPENCLAW_TOKEN
```bash
openclaw config get gateway.auth.token
```

## Deploy
Push to `main` branch → Cloudflare auto-deploys.
