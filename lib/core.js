// ฟังก์ชันกลาง: รหัสผ่านผู้ดูแล, คุกกี้, ข้อมูลแผน (ค่าตั้งต้น + ส่วนที่แก้ไขเก็บใน KV)
import SEED from './seed.json';

const COOKIE = 'lap_session';
const enc = new TextEncoder();

async function hmac(env, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode((env.ADMIN_PASSWORD || '') + '|la-action-plan'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]));
}

export async function makeCookie(env) {
  const exp = String(Date.now() + 1000 * 60 * 60 * 24 * 30);
  return `${COOKIE}=${exp}.${await hmac(env, exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function isAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const raw = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  return !!exp && Number(exp) > Date.now() && sig === (await hmac(env, exp));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

// ที่เก็บข้อมูล: รองรับทั้ง KV namespace และ D1 database ที่ผูกไว้ชื่อ PLAN_KV
function store(env) {
  const db = env.PLAN_KV;
  if (!db) throw new Error('ยังไม่ได้ผูกที่เก็บข้อมูลชื่อ PLAN_KV ในหน้าตั้งค่า Cloudflare Pages (Settings › Bindings)');
  if (typeof db.prepare === 'function') {
    // D1 database
    const ready = db.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)').run();
    return {
      async get(k) { await ready; const r = await db.prepare('SELECT v FROM kv WHERE k = ?').bind(k).first(); return r ? JSON.parse(r.v) : null; },
      async put(k, v) { await ready; await db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, JSON.stringify(v)).run(); },
    };
  }
  if (typeof db.get === 'function') {
    // KV namespace
    return { get: (k) => db.get(k, 'json'), put: (k, v) => db.put(k, JSON.stringify(v)) };
  }
  throw new Error('PLAN_KV ถูกตั้งเป็นตัวแปรข้อความ — ให้ผูกใหม่ที่ Settings › Bindings เป็น KV namespace หรือ D1 database แล้ว Retry deployment');
}
export async function getState(env) {
  return (await store(env).get('state')) || { items: {}, roles: {}, log: [] };
}
export async function saveState(env, state) {
  state.updatedAt = new Date().toISOString();
  await store(env).put('state', state);
}
export function seedItem(id) {
  return SEED.items.find((i) => i.id === id);
}

// รวมค่าตั้งต้นกับส่วนที่แก้ไข แล้วคำนวณสถานะ
export function merged(state) {
  const items = SEED.items.map((base) => {
    const o = state.items[base.id] || {};
    const it = { ...base, ...o, steps: o.steps || base.steps };
    const n = it.steps.filter((s) => s.done).length;
    it.status = n === it.steps.length ? 'done' : n > 0 || it.started ? 'doing' : 'todo';
    return it;
  });
  return { items, sections: SEED.sections, roles: state.roles || {}, updatedAt: state.updatedAt || null, settings: state.settings || {} };
}

export function addLog(state, text) {
  state.log ||= [];
  state.log.unshift({ at: new Date().toISOString(), text });
  state.log = state.log.slice(0, 300);
}
