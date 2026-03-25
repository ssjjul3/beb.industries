/**
 * Cloudflare Pages Function — /functions/subagents.js
 * Returns live n8n workflow status as SA-01, SA-02, SA-03
 * GET /subagents → JSON array
 */
export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://beb.industries',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  try {
    const n8nUrl = env.N8N_URL;     // e.g. http://10.21.0.15:5678
    const n8nKey = env.N8N_API_KEY;

    const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': n8nKey },
    });

    const data = await response.json();
    const workflows = data.data ?? [];

    // Map first 3 active workflows to SA-01/02/03
    const active = workflows.filter(w => w.active).slice(0, 3);
    const agents = active.map((w, i) => ({
      id: `SA-0${i + 1}`,
      name: w.name,
      status: 'ACTIVE',
      lastRun: w.updatedAt ?? null,
    }));

    // Pad to 3 slots
    while (agents.length < 3) {
      agents.push({ id: `SA-0${agents.length + 1}`, name: 'IDLE', status: 'STANDBY', lastRun: null });
    }

    return new Response(JSON.stringify(agents), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://beb.industries',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
