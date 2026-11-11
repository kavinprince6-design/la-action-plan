import { getState, merged, json, isAdmin } from '../../lib/core.js';

// ข้อมูลแผนทั้งหมด — เปิดอ่านได้ทุกคน
export async function onRequestGet({ request, env }) {
  const state = await getState(env);
  const data = merged(state);
  data.admin = await isAdmin(request, env);
  if (data.admin) data.log = (state.log || []).slice(0, 80);
  return json(data);
}
