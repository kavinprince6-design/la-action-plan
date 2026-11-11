import { getState, saveState, json, isAdmin, addLog } from '../../lib/core.js';

// ทำเนียบผู้รับผิดชอบ: ตำแหน่ง → ชื่อจริง และการตั้งค่าวันส่ง (เฉพาะผู้ดูแล)
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแล' }, 401);
  const b = await request.json().catch(() => ({}));
  const state = await getState(env);
  if (b.roles && typeof b.roles === 'object') {
    const roles = {};
    for (const [k, v] of Object.entries(b.roles)) if (typeof v === 'string' && v.trim()) roles[String(k).slice(0, 200)] = v.trim().slice(0, 200);
    state.roles = roles;
  }
  if (b.settings && typeof b.settings === 'object') {
    const s = (state.settings ||= {});
    for (const k of ['submit', 'deadline', 'received']) if (/^\d{4}-\d{2}-\d{2}$/.test(b.settings[k] || '')) s[k] = b.settings[k];
  }
  addLog(state, 'แก้ไขทำเนียบผู้รับผิดชอบ/การตั้งค่า');
  await saveState(env, state);
  return json({ ok: true, roles: state.roles, settings: state.settings || {} });
}
