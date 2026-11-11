import { getState, saveState, merged, json, isAdmin, seedItem, addLog } from '../../lib/core.js';

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// แก้ไขข้อ: ผู้รับผิดชอบ, วันเริ่ม/กำหนดเสร็จ, ขั้นตอน, หมายเหตุ (เฉพาะผู้ดูแล)
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแล' }, 401);
  const b = await request.json().catch(() => ({}));
  const base = seedItem(b.id);
  if (!base) return json({ error: 'ไม่พบข้อนี้' }, 404);
  const state = await getState(env);
  const o = (state.items[b.id] ||= {});
  if (typeof b.owner === 'string' && b.owner.trim()) o.owner = b.owner.trim().slice(0, 300);
  if (isDate(b.start)) o.start = b.start;
  if (isDate(b.due)) o.due = b.due;
  if (typeof b.note === 'string') o.note = b.note.slice(0, 2000);
  if (typeof b.started === 'boolean') o.started = b.started;
  if (Array.isArray(b.steps) && b.steps.length >= 1 && b.steps.length <= 12) {
    const old = o.steps || base.steps;
    o.steps = b.steps.map((s, k) => {
      const done = !!s.done;
      const prev = old[k] || {};
      return {
        t: String(s.t || '').trim().slice(0, 600) || 'ขั้นตอน',
        due: isDate(s.due) ? s.due : prev.due || base.due,
        done,
        doneAt: done ? (prev.done && prev.doneAt) || (isDate(s.doneAt) ? s.doneAt : new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)) : null,
      };
    });
  }
  o.updatedAt = new Date().toISOString();
  const now = merged(state).items.find((i) => i.id === b.id);
  addLog(state, `OFI-${b.id}: บันทึกการแก้ไข (${now.steps.filter((s) => s.done).length}/${now.steps.length} ขั้นตอน)`);
  await saveState(env, state);
  return json({ ok: true, item: now, updatedAt: state.updatedAt });
}

// คืนค่าข้อนี้เป็นแผนตั้งต้น
export async function onRequestDelete({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแล' }, 401);
  const b = await request.json().catch(() => ({}));
  if (!seedItem(b.id)) return json({ error: 'ไม่พบข้อนี้' }, 404);
  const state = await getState(env);
  delete state.items[b.id];
  addLog(state, `OFI-${b.id}: คืนค่าเป็นแผนตั้งต้น`);
  await saveState(env, state);
  return json({ ok: true, item: merged(state).items.find((i) => i.id === b.id) });
}
