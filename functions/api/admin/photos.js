import { CATEGORIES, sniff, json, toB64 } from '../../_lib/util.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, title, category, status, created_at FROM photos ORDER BY created_at DESC'
  ).all();
  return json(results);
}

const MAX = 1_400_000; // stored as base64 text; D1 rows must stay under 2 MB

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const file = form.get('file'), thumb = form.get('thumb');
  if (!file || typeof file === 'string') return json({ error: 'No file received.' }, 400);
  if (file.size > MAX) return json({ error: 'Photo is too large after compression.' }, 413);
  const type = await sniff(file);
  if (!type) return json({ error: 'Only WebP or JPEG images are accepted.' }, 415);

  const id = crypto.randomUUID();
  const title = String(form.get('title') || 'Untitled').slice(0, 120);
  const cat = CATEGORIES.includes(form.get('category')) ? form.get('category') : 'Wildlife';
  const num = v => Math.max(0, Math.min(10000, parseInt(v, 10) || 0));
  const stmts = [
    env.DB.prepare('INSERT INTO photos (id, title, category, status, created_at, w, h) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, title, cat, 'draft', Date.now(), num(form.get('w')), num(form.get('h'))),
    env.DB.prepare('INSERT INTO photo_data (id, kind, type, data) VALUES (?, ?, ?, ?)')
      .bind(id, 'full', type, toB64(await file.arrayBuffer())),
  ];
  if (thumb && typeof thumb !== 'string' && thumb.size <= MAX && (await sniff(thumb))) {
    stmts.push(env.DB.prepare('INSERT INTO photo_data (id, kind, type, data) VALUES (?, ?, ?, ?)')
      .bind(id, 'thumb', await sniff(thumb), toB64(await thumb.arrayBuffer())));
  }
  await env.DB.batch(stmts);
  return json({ id }, 201);
}
