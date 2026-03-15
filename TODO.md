# TODO การพัฒนาโปรแกรม Equipment Borrow & Tracking System

> อ้างอิงหลัก: `equipment-borrow-dev-guide.md`

## 1) กติกาหลักของโปรเจกต์ (ต้องทำครบ)
- [x] หน้าแสดงข้อมูลต้องเป็นตาราง
- [x] เพิ่ม/แก้ไขข้อมูลผ่าน Modal Popup
- [x] ปฏิทิน/วันที่ต้องเป็นปี พ.ศ. และเดือนภาษาไทย
- [x] ไม่มีการใช้ข้อมูลจำลอง (mock/simulated data)
- [x] มีการแสดง log อย่างละเอียดในขั้นตอนสำคัญ
- [x] เอกสารและ comment ต้องเป็นภาษาไทย
- [x] ธีมโปรเจกต์ต้องเป็นสไตล์สีโทนร้อน

## 2) งานเตรียมระบบ
- [x] ตั้งค่า `.env` สำหรับ Backend/Frontend ให้ครบ
- [x] ตรวจสอบการเชื่อมต่อ PostgreSQL จริง
- [x] ตั้งค่า CORS และ JWT ให้ใช้งานได้จริง
- [x] เตรียมโครงสร้างโฟลเดอร์ตามคู่มือ (`backend/EquipmentBorrow.API`, `frontend/`)

## 3) งานฐานข้อมูล (อ้างอิงหัวข้อ Database Schema)
- [x] สร้างตาราง `users`, `equipment_categories`, `equipment`, `borrow_requests`, `return_records`
- [x] สร้าง index ตามคู่มือ (`idx_borrow_borrower`, `idx_borrow_status`, `idx_equipment_status`, `idx_return_borrow`)
- [x] ตรวจสอบ enum/status ให้ตรงคู่มือ (`pending/approved/rejected/returned`, `normal/resigned/broken/other`)

## 4) งานฝั่ง Backend (อ้างอิงหัวข้อ Backend API/.NET 9)
- [x] ทำ API Auth: register/login พร้อม role admin/staff
- [x] ทำ API อุปกรณ์: list/detail/create/update/delete
- [x] ทำ API ยืม: สร้างคำขอ/อนุมัติ/ปฏิเสธ
- [x] ทำ API คืน: บันทึกการคืนพร้อมเหตุผล
- [x] ทำ API รายงาน: summary/period/equipment/overdue
- [x] เพิ่ม validation ทุก endpoint
- [x] เพิ่ม log ขั้นตอน: รับคำขอ/ตรวจสอบ/บันทึก/ผลลัพธ์/ข้อผิดพลาด
- [x] ลงทะเบียน DI services ตามคู่มือ (`IAuthService`, `IEquipmentService`, `IBorrowService`, `IReturnService`, `IReportService`)
- [x] ตั้งค่า `Program.cs` ให้มี Swagger, CORS, Authentication, Authorization ตามคู่มือ

## 5) งานฝั่ง Frontend (อ้างอิงหัวข้อ Frontend Next.js + Tailwind)
- [x] ทำหน้า login/register
- [x] ทำหน้า dashboard
- [x] ทำหน้า employees/equipment/borrow/return/history/reports
- [x] ทุกหน้ารายการข้อมูลใช้ตาราง
- [x] ฟอร์มเพิ่ม/แก้ไขใช้ Modal Popup ทุกจุด
- [x] แสดงวันที่แบบ `th-TH-u-ca-buddhist` และเดือนภาษาไทย
- [x] เชื่อม API จริงทั้งหมด (ไม่ใช้ mock data)
- [x] เพิ่ม log ฝั่ง UI สำหรับ action สำคัญและผลลัพธ์จาก API
- [x] จัดทำ `lib/api.ts` ให้ครบชุด endpoint ตามคู่มือ
- [x] ทำ Sidebar แยกสิทธิ์เมนูตาม role `admin/staff`
- [x] กำหนดชุดสีหลักใน `tailwind.config.ts` ให้เป็นโทนร้อน (เช่น ส้ม/แดงอิฐ/ทอง)
- [x] เรียงข้อมูลจากหัวตารางได้ทุกหน้าที่เป็นตาราง

## 6) งาน Business Logic (อ้างอิงหัวข้อ Business Logic Flow)
- [x] ทดสอบการขอยืม: ต้องตรวจ `available_qty > 0` ก่อนสร้างคำขอ
- [x] ทดสอบอนุมัติยืม: อนุมัติแล้วต้อง `available_qty--`
- [x] ทดสอบการคืน: `normal/resigned` ต้องเพิ่มสต็อก, `broken` ไม่เพิ่มสต็อก
- [x] ทดสอบกรณีพนักงานลาออกและการคืนค้างทั้งหมด

## 7) งานทดสอบ
- [x] ทดสอบ flow: login -> borrow -> approve/reject -> return
- [x] ทดสอบสิทธิ์ role (admin/staff)
- [x] ทดสอบกรณีสต็อกไม่พอ
- [x] ทดสอบกรณีคืนแบบ normal/resigned/broken
- [x] ทดสอบรูปแบบวันที่ พ.ศ. และเดือนภาษาไทย

## 8) งานก่อนส่งมอบ
- [x] ตรวจว่าไม่มี mock data เหลือในโค้ด
- [x] ตรวจว่าเอกสารและ comment เป็นภาษาไทย
- [x] ตรวจ log ครบทุกจุดสำคัญ
- [x] อัปเดตเอกสารวิธีติดตั้งและใช้งานล่าสุด
- [x] ตรวจความถูกต้อง endpoint เทียบหัวข้อ API Endpoints Reference ในคู่มือ
- [x] ตรวจค่าตัวแปรสภาพแวดล้อมตามหัวข้อ Environment Variables
- [x] ตรวจความสอดคล้องของ UI Theme ให้เป็นโทนร้อนทั้งระบบ
