// ส่งข้อความผิดพลาดเป็นภาษาไทยให้หน้าเว็บแสดงได้ แทนหน้า error ของ Cloudflare
export async function onRequest(context) {
  try {
    return await context.next();
  } catch (e) {
    return new Response(JSON.stringify({ error: e && e.message ? e.message : String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
