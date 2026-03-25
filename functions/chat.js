/**
 * Cloudflare Pages Function — /functions/chat.js
 * Proxies chat requests to OpenClaw gateway (keeps token secret)
 * POST /chat { message: string } → streamed or JSON response
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://beb.industries',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const message = body.message?.trim();
    if (!message) {
      return new Response(JSON.stringify({ error: 'No message' }), { status: 400, headers: corsHeaders });
    }

    // OpenClaw gateway endpoint — set OPENCLAW_URL + OPENCLAW_TOKEN in Cloudflare env vars
    const gatewayUrl = env.OPENCLAW_URL; // e.g. https://umbrel.tail1234.ts.net:18789
    const token = env.OPENCLAW_TOKEN;

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: [{ role: 'user', content: message }],
        stream: false,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `Gateway error: ${err}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? '...';

    return new Response(JSON.stringify({ reply }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
