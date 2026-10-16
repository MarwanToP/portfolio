export const CATEGORIES = ['Wildlife', 'Portrait', 'Street', 'Editorial'];
export const isId = s => /^[0-9a-f-]{36}$/.test(String(s));
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Trust the file's real bytes, not the type the browser claims.
export async function sniff(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
               b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return webp ? 'image/webp' : jpeg ? 'image/jpeg' : null;
}

export function toB64(buf) {
  const u = new Uint8Array(buf); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
export const fromB64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
export async function readImage(env, id, kind) {
  const row = await env.DB.prepare('SELECT type, data FROM photo_data WHERE id = ? AND kind = ?').bind(id, kind).first();
  return row ? { type: row.type, bytes: fromB64(row.data) } : null;
}
