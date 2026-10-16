// Runs before every /api/admin/* route. No valid token, no access.
const enc = new TextEncoder();
const sha = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));

export async function onRequest({ request, env, next }) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16) {
    return new Response('Admin is not configured.', { status: 503 });
  }
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  const ok = crypto.subtle.timingSafeEqual(await sha(given), await sha(env.ADMIN_TOKEN));
  return ok ? next() : new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
