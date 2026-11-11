# la-action-plan — ติดตามแผนแก้ไขโอกาสพัฒนา LA (รพ.ห้วยแถลง)

- `/` หน้าสาธารณะ (ไม่ต้องเข้าสู่ระบบ): ภาพรวม · แผนปฏิบัติการรายข้อ · ผู้รับผิดชอบ · ไทม์ไลน์
- `/admin` หน้าห้องปฏิบัติการ (ใช้รหัสผ่าน): ติ๊กขั้นตอน แก้ผู้รับผิดชอบ/วันกำหนด/หมายเหตุ, ทำเนียบผู้รับผิดชอบ, ตั้งค่าวันสำคัญ

## ติดตั้งบน Cloudflare Pages
1. สร้าง KV namespace หรือ D1 database ชื่อ `la-action-plan` (ใช้ได้ทั้งสองแบบ)
2. Workers & Pages › Create › Pages › Connect to Git › repo `la-action-plan` · Framework: None · Build command: ว่าง · Output: `public`
3. Settings › Bindings › Add › KV namespace หรือ D1 database · Variable name `PLAN_KV` → `la-action-plan`
4. Settings › Variables and Secrets › Add (Secret) `ADMIN_PASSWORD` = รหัสของทีมแล็บ
5. Deployments › ⋯ › Retry deployment

แผนตั้งต้น 53 ข้ออยู่ใน `lib/seed.json` ส่วนที่แก้ไขผ่านหน้า admin เก็บใน KV (key `state`)
