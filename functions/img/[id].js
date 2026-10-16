import { isId, readImage } from '../_lib/util.js';

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const id = String(params.id);
  if (!isId(id)) return new Response('Not found', { status: 404 });
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const row = await env.DB.prepare("SELECT id FROM photos WHERE id = ? AND status = 'published'").bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });
  const thumb = new URL(request.url).searchParams.has('t');
  const img = (thumb && await readImage(env, id, 'thumb')) || await readImage(env, id, 'full');
  if (!img) return new Response('Not found', { status: 404 });
  const res = new Response(img.body, { headers: { 'Content-Type': img.type, 'Cache-Control': 'public, max-age=86400' } });
  context.waitUntil(cache.put(request, res.clone()));
  return res;
}
