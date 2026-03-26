/**
 * BEB INDUSTRIES — Main Worker
 * Handles all dynamic routes. Static assets served by ASSETS binding.
 */


const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BEB INDUSTRIES — AUTHENTICATE</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a1a;
      --green: #00ff88;
      --dim: #00aa55;
      --red: #ff3355;
      --text: #c0ffee;
      --border: #00ff88;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: fixed; inset: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px);
      pointer-events: none;
      z-index: 999;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }

    .container {
      width: 100%;
      max-width: 480px;
      padding: 20px;
      animation: fadeIn 0.5s ease;
    }

    .logo {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo-main {
      font-size: 16px;
      color: var(--green);
      text-shadow: 0 0 20px var(--green);
      letter-spacing: 4px;
      line-height: 2;
    }
    .logo-sub {
      font-size: 8px;
      color: var(--dim);
      letter-spacing: 3px;
      margin-top: 8px;
    }

    .panel {
      border: 2px solid var(--green);
      padding: 30px;
      position: relative;
      background: rgba(0,255,136,0.03);
    }
    .panel::before {
      content: '▸ SECURE ACCESS ◂';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg);
      padding: 0 12px;
      font-size: 8px;
      color: var(--dim);
      white-space: nowrap;
    }

    .field {
      margin-bottom: 24px;
    }
    .field label {
      display: block;
      font-size: 8px;
      color: var(--dim);
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .field input {
      width: 100%;
      background: transparent;
      border: 1px solid var(--dim);
      color: var(--green);
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 12px 10px;
      outline: none;
      caret-color: var(--green);
      letter-spacing: 4px;
      transition: border-color 0.2s;
    }
    .field input:focus { border-color: var(--green); }
    .field input::placeholder { color: var(--dim); letter-spacing: 2px; font-size: 8px; }

    .btn {
      width: 100%;
      background: transparent;
      border: 2px solid var(--green);
      color: var(--green);
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      padding: 14px;
      cursor: pointer;
      letter-spacing: 3px;
      transition: all 0.1s;
      position: relative;
    }
    .btn:hover { background: var(--green); color: var(--bg); }
    .btn:active { transform: scale(0.98); }
    .btn.loading { opacity: 0.6; cursor: not-allowed; }

    .error {
      display: none;
      color: var(--red);
      font-size: 8px;
      letter-spacing: 2px;
      text-align: center;
      margin-top: 16px;
      animation: shake 0.4s ease;
    }
    .error.visible { display: block; }

    .cursor {
      display: inline-block;
      animation: blink 1s infinite;
    }

    .status-line {
      text-align: center;
      font-size: 7px;
      color: var(--dim);
      letter-spacing: 2px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-main">BEB<br>INDUSTRIES</div>
      <div class="logo-sub">COMMAND CENTRE v3.0</div>
    </div>

    <div class="panel">
      <div class="field">
        <label>ACCESS CODE</label>
        <input
          type="password"
          id="password"
          placeholder="••••••••"
          autocomplete="current-password"
          autofocus
        />
      </div>
      <button class="btn" id="loginBtn" onclick="doLogin()">
        ▸ AUTHENTICATE ◂
      </button>
      <div class="error" id="error">⚠ ACCESS DENIED — INVALID CREDENTIALS</div>
    </div>

    <div class="status-line">
      ENCRYPTED CHANNEL<span class="cursor">▮</span>
    </div>
  </div>

  <script>
    const input = document.getElementById('password');
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('error');

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });

    async function doLogin() {
      const password = input.value;
      if (!password) return;

      btn.classList.add('loading');
      btn.textContent = '▸ AUTHENTICATING... ◂';
      errorEl.classList.remove('visible');

      try {
        const res = await fetch('/_auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (data.ok) {
          btn.textContent = '▸ ACCESS GRANTED ◂';
          btn.style.borderColor = 'var(--green)';
          btn.style.background = 'var(--green)';
          btn.style.color = 'var(--bg)';
          setTimeout(() => window.location.href = '/', 500);
        } else {
          input.value = '';
          errorEl.classList.add('visible');
          btn.classList.remove('loading');
          btn.textContent = '▸ AUTHENTICATE ◂';
          input.focus();
        }
      } catch (e) {
        errorEl.textContent = '⚠ CONNECTION ERROR — TRY AGAIN';
        errorEl.classList.add('visible');
        btn.classList.remove('loading');
        btn.textContent = '▸ AUTHENTICATE ◂';
      }
    }
  </script>
</body>
</html>
`;

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

    // Login page — always public (served inline to avoid redirect loops)
    if (path === '/login' || path === '/login.html') {
      return new Response(LOGIN_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
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
