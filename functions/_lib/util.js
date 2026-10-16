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

// Photo bytes live in Workers KV (binary, no decoding work): keys "full:<id>" and "thumb:<id>".
export async function readImage(env, id, kind) {
  const { value, metadata } = await env.PHOTOS.getWithMetadata(`${kind}:${id}`, { type: 'stream' });
  return value ? { body: value, type: metadata?.type || 'image/webp' } : null;
}
