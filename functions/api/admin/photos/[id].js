import { CATEGORIES, isId, json } from '../../../_lib/util.js';

export async function onRequestPatch({ params, request, env }) {
  if (!isId(params.id)) return json({ error: 'Bad id.' }, 400);
  const b = (await request.json().catch(() => null)) || {};
  const sets = [], vals = [];
  if (typeof b.title === 'string') { sets.push('title = ?'); vals.push(b.title.slice(0, 120)); }
  if (CATEGORIES.includes(b.category)) { sets.push('category = ?'); vals.push(b.category); }
  if (b.status === 'draft' || b.status === 'published') { sets.push('status = ?'); vals.push(b.status); }
  if (!sets.length) return json({ error: 'Nothing to update.' }, 400);
  const r = await env.DB.prepare(`UPDATE photos SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, params.id).run();
  return r.meta.changes ? json({ ok: true }) : json({ error: 'Not found.' }, 404);
}

export async function onRequestDelete({ params, env }) {
  if (!isId(params.id)) return json({ error: 'Bad id.' }, 400);
  await Promise.all([env.PHOTOS.delete(`full:${params.id}`), env.PHOTOS.delete(`thumb:${params.id}`)]);
  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
