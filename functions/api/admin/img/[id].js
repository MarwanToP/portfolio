import { isId, readImage } from '../../../_lib/util.js';

// Lets the admin page preview drafts. Guarded by the middleware above.
export async function onRequestGet({ params, env }) {
  if (!isId(params.id)) return new Response('Not found', { status: 404 });
  const img = await readImage(env, params.id, 'thumb') || await readImage(env, params.id, 'full');
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(img.bytes, { headers: { 'Content-Type': img.type, 'Cache-Control': 'private, no-store' } });
}
