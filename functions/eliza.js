/**
 * Cloudflare Pages Function — /functions/eliza.js
 * Proxies requests to ElizaOS agent for on-chain actions
 * POST /eliza { action, params } → ElizaOS response
 *
 * Actions:
 *   - message: send a message to ElizaOS agent
 *   - balance: get wallet balances
 *   - agents: list active agents
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const elizaUrl = env.ELIZA_URL; // e.g. https://eliza.beb.industries or CF Tunnel URL
    const agentId = env.ELIZA_AGENT_ID || 'default';

    if (!elizaUrl) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'ElizaOS not configured. Set ELIZA_URL in env vars.',
        status: 'OFFLINE'
      }), { status: 503, headers: corsHeaders });
    }

    // Route to ElizaOS API
    const action = body.action || 'message';

    if (action === 'message') {
      // Send message to ElizaOS agent
      const res = await fetch(`${elizaUrl}/${agentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: body.text,
          userId: 'beb-user',
          userName: '$$j3',
          roomId: 'beb-command-centre',
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ ok: true, messages: data }), { headers: corsHeaders });
    }

    if (action === 'agents') {
      const res = await fetch(`${elizaUrl}/agents`);
      const data = await res.json();
      return new Response(JSON.stringify({ ok: true, agents: data }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Unknown action' }), {
      status: 400, headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  // Health check — is ElizaOS reachable?
  try {
    const res = await fetch(`${env.ELIZA_URL}/agents`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, agents: data?.agents?.length ?? 0 }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, status: 'OFFLINE' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
