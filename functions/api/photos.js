export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, title, category, w, h FROM photos WHERE status = 'published' ORDER BY created_at DESC"
  ).all();
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}
