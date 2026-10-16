import { json } from '../../_lib/util.js';

// Publishes every draft in one go.
export async function onRequestPost({ env }) {
  const r = await env.DB.prepare("UPDATE photos SET status = 'published' WHERE status = 'draft'").run();
  return json({ ok: true, published: r.meta.changes });
}
