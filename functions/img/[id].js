import { isId, readImage } from '../_lib/util.js';

export async function onRequestGet({ params, request, env }) {
  const id = String(params.id);
  if (!isId(id)) return new Response('Not found', { status: 404 });
  const row = await env.DB.prepare("SELECT id FROM photos WHERE id = ? AND status = 'published'").bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });
  const thumb = new URL(request.url).searchParams.has('t');
  const img = await readImage(env, id, thumb ? 'thumb' : 'full') || await readImage(env, id, 'full');
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(img.bytes, { headers: { 'Content-Type': img.type, 'Cache-Control': 'public, max-age=86400' } });
}
