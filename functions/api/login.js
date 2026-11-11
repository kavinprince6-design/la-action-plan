import { makeCookie, clearCookie, json } from '../../lib/core.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ error: 'ยังไม่ได้ตั้งรหัสผ่าน ADMIN_PASSWORD ในหน้าตั้งค่า Cloudflare Pages' }, 500);
  const b = await request.json().catch(() => ({}));
  if (String(b.password || '') !== env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 700));
    return json({ error: 'รหัสผ่านไม่ถูกต้อง' }, 401);
  }
  return json({ ok: true }, 200, { 'Set-Cookie': await makeCookie(env) });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
}
