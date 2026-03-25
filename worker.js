/**
 * BEB INDUSTRIES — Main Worker
 * Handles all dynamic routes. Static assets served by ASSETS binding.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ── STATIC ASSETS ─────────────────────────────────────────────────────────
    // Let Cloudflare serve static files directly
    if (
      path === '/' ||
      path === '/index.html' ||
      path.match(/\.(css|js|png|jpg|ico|svg|woff|woff2)$/)
    ) {
      // Auth check for index
      if (path === '/' || path === '/index.html') {
        const session = getCookie(request, 'beb_session');
        if (!session || session !== env.SESSION_SECRET) {
          return Response.redirect(new URL('/login', request.url).toString(), 302);
        }
      }
      return env.ASSETS.fetch(request);
    }

    // Login page — always public
    if (path === '/login' || path === '/login.html') {
      return env.ASSETS.fetch(new Request(new URL('/login.html', request.url), request));
    }

    // ── AUTH ──────────────────────────────────────────────────────────────────
    if (path === '/_auth/login' && method === 'POST') {
      return handleLogin(request, env);
    }
    if (path === '/_auth/logout' && method === 'POST') {
      return handleLogout();
    }

    // ── AUTHENTICATED ROUTES ──────────────────────────────────────────────────
    const session = getCookie(request, 'beb_session');
    if (!session || session !== env.SESSION_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/chat' && method === 'POST') return handleChat(request, env);
    if (path === '/subagents' && method === 'GET') return handleSubagents(request, env);
    if (path === '/research' && method === 'GET') return handleResearch(request, env);
    if (path === '/research' && method === 'POST') return handleResearchPost(request, env);
    if (path === '/eliza') return handleEliza(request, env);

    // Fallback to assets
    return env.ASSETS.fetch(request);
  }
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== env.SITE_PASSWORD) {
    return json({ ok: false, error: 'ACCESS DENIED' }, 401);
  }
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `beb_session=${env.SESSION_SECRET}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}

function handleLogout() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'beb_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
    },
  });
}

// ── CHAT → OPENCLAW ───────────────────────────────────────────────────────────
async function handleChat(request, env) {
  const body = await request.json();
  const message = body.message?.trim();
  if (!message) return json({ error: 'No message' }, 400);

  if (!env.OPENCLAW_URL) return json({ reply: '[OpenClaw not configured]' });

  const res = await fetch(`${env.OPENCLAW_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'openclaw:main',
      messages: [{ role: 'user', content: message }],
      stream: false,
      max_tokens: 1024,
    }),
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? 'No response.';
  return json({ reply });
}

// ── SUBAGENTS → N8N ───────────────────────────────────────────────────────────
async function handleSubagents(request, env) {
  if (!env.N8N_URL) {
    return json([
      { id: 'SA-01', name: 'OLLAMA HEALTH', status: 'ACTIVE', lastRun: null },
      { id: 'SA-02', name: 'IDLE', status: 'STANDBY', lastRun: null },
      { id: 'SA-03', name: 'IDLE', status: 'STANDBY', lastRun: null },
    ]);
  }

  const res = await fetch(`${env.N8N_URL}/api/v1/workflows`, {
    headers: { 'X-N8N-API-KEY': env.N8N_API_KEY },
  });
  const data = await res.json();
  const workflows = data.data ?? [];
  const active = workflows.filter(w => w.active).slice(0, 3);
  const agents = active.map((w, i) => ({
    id: `SA-0${i + 1}`,
    name: w.name,
    status: 'ACTIVE',
    lastRun: w.updatedAt ?? null,
  }));
  while (agents.length < 3) {
    agents.push({ id: `SA-0${agents.length + 1}`, name: 'IDLE', status: 'STANDBY', lastRun: null });
  }
  return json(agents);
}

// ── RESEARCH → KV ─────────────────────────────────────────────────────────────
async function handleResearch(request, env) {
  const raw = await env.RESEARCH_KV?.get('items').catch(() => null);
  const items = raw ? JSON.parse(raw) : defaultResearch();
  return json(items);
}

async function handleResearchPost(request, env) {
  const secret = request.headers.get('X-Research-Secret');
  if (secret !== env.RESEARCH_SECRET) return new Response('Unauthorized', { status: 401 });
  const item = await request.json();
  const raw = await env.RESEARCH_KV?.get('items').catch(() => null);
  const items = raw ? JSON.parse(raw) : [];
  items.unshift({ ...item, timestamp: new Date().toISOString() });
  if (items.length > 20) items.length = 20;
  await env.RESEARCH_KV?.put('items', JSON.stringify(items));
  return json({ ok: true });
}

function defaultResearch() {
  return [
    { title: 'BTC HALVING CYCLE ANALYSIS', status: 'ACTIVE', updated: null },
    { title: 'L2 SCALING COMPARISON', status: 'QUEUED', updated: null },
    { title: 'POLYMARKET ARBITRAGE', status: 'QUEUED', updated: null },
    { title: 'SOLANA DeFi LANDSCAPE', status: 'QUEUED', updated: null },
  ];
}

// ── ELIZA → ON-CHAIN ──────────────────────────────────────────────────────────
async function handleEliza(request, env) {
  if (!env.ELIZA_URL) return json({ ok: false, status: 'OFFLINE', error: 'ElizaOS not configured' });

  if (request.method === 'GET') {
    try {
      const res = await fetch(`${env.ELIZA_URL}/agents`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return json({ ok: true, agents: data?.agents?.length ?? 0 });
    } catch {
      return json({ ok: false, status: 'OFFLINE' });
    }
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const agentId = env.ELIZA_AGENT_ID || 'default';
    const res = await fetch(`${env.ELIZA_URL}/${agentId}/message`, {
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
    return json({ ok: true, messages: data });
  }

  return json({ error: 'Method not allowed' }, 405);
}
