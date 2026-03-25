/**
 * Cloudflare Pages Function — /functions/research.js
 * Serves research items pushed by n8n
 * GET /research → JSON array of research items
 * POST /research (internal, from n8n) → store new item in KV
 */
export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

  try {
    // Read from Cloudflare KV (bind KV namespace as RESEARCH_KV in Pages settings)
    const raw = await env.RESEARCH_KV?.get('items');
    const items = raw ? JSON.parse(raw) : defaultResearch();

    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify(defaultResearch()), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  // Validate internal secret
  const secret = request.headers.get('X-Research-Secret');
  if (secret !== env.RESEARCH_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const item = await request.json();
  const raw = await env.RESEARCH_KV?.get('items');
  const items = raw ? JSON.parse(raw) : [];

  // Prepend new item, keep last 20
  items.unshift({ ...item, timestamp: new Date().toISOString() });
  if (items.length > 20) items.length = 20;

  await env.RESEARCH_KV?.put('items', JSON.stringify(items));
  return new Response(JSON.stringify({ ok: true }));
}

function defaultResearch() {
  return [
    { title: 'BTC HALVING CYCLE ANALYSIS', status: 'ACTIVE', updated: null },
    { title: 'L2 SCALING COMPARISON', status: 'QUEUED', updated: null },
    { title: 'POLYMARKET ARBITRAGE', status: 'QUEUED', updated: null },
    { title: 'SOLANA DeFi LANDSCAPE', status: 'QUEUED', updated: null },
  ];
}
