/**
 * Cloudflare Pages Function — /functions/_auth.js
 * Handles login/logout
 * POST /_auth/login { password } → set session cookie
 * POST /_auth/logout → clear cookie
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // ── LOGIN ──
  if (url.pathname === '/_auth/login') {
    const body = await request.json().catch(() => ({}));

    if (body.password !== env.SITE_PASSWORD) {
      return new Response(JSON.stringify({ ok: false, error: 'ACCESS DENIED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set session cookie — httpOnly, secure, 7 day expiry
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `beb_session=${env.SESSION_SECRET}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  // ── LOGOUT ──
  if (url.pathname === '/_auth/logout') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'beb_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
      },
    });
  }

  return new Response('Not found', { status: 404 });
}
