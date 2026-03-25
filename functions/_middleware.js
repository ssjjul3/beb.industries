/**
 * Cloudflare Pages Middleware — runs on every request
 * Gates the entire site behind a session cookie
 * Public routes: /login, /login.html, /_auth
 */
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Public paths — always allow
  const publicPaths = ['/_auth', '/login', '/login.html', '/favicon.ico'];
  if (publicPaths.some(p => url.pathname.startsWith(p))) {
    return next();
  }

  // Check session cookie
  const cookie = request.headers.get('Cookie') || '';
  const sessionToken = parseCookie(cookie, 'beb_session');

  if (!sessionToken || sessionToken !== env.SESSION_SECRET) {
    // Redirect to login
    return Response.redirect(new URL('/login', request.url).toString(), 302);
  }

  return next();
}

function parseCookie(cookieStr, name) {
  const match = cookieStr.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
