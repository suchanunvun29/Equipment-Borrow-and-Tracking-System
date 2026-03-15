# คู่มือรันระบบ (ไม่ใช้ Docker)

เอกสารนี้อัปเดตล่าสุดตามโค้ดปัจจุบันของโปรเจกต์ และรันด้วย PostgreSQL แบบ local

## 1) เตรียมฐานข้อมูล PostgreSQL (Local)

- Host: `localhost`
- Port: `5432`
- Database: `equipment_borrow`
- Username: `admin`
- Password: `password`

> ค่าเชื่อมต่อนี้ถูกตั้งไว้ใน `backend/EquipmentBorrow.API/appsettings.Development.json`

## 2) รัน Migration

```powershell
dotnet ef database update --project "backend/EquipmentBorrow.API/EquipmentBorrow.API.csproj" --startup-project "backend/EquipmentBorrow.API/EquipmentBorrow.API.csproj"
```

ผลที่คาดหวัง:
- ตารางหลักถูกสร้างครบ: `Users`, `Equipment`, `BorrowRequests`, `ReturnRecords`, `EquipmentCategories`
- ตารางประวัติ migration: `__EFMigrationsHistory`

## 3) รัน Backend API

```powershell
dotnet run --project "backend/EquipmentBorrow.API/EquipmentBorrow.API.csproj"
```

ตรวจสอบสุขภาพระบบ:
- `GET http://localhost:5001/api/health`

Swagger:
- `http://localhost:5001/swagger`

## 4) รัน Frontend

```powershell
cd frontend
npm install
npm run dev
```

หน้าใช้งาน:
- `http://localhost:3000`

## 5) ลำดับทดสอบแนะนำ

1. ลงทะเบียนผู้ใช้ staff
2. login ผู้ใช้ staff
3. admin เพิ่มอุปกรณ์
4. staff สร้างคำขอยืม
5. admin อนุมัติ/ปฏิเสธ
6. admin บันทึกคืน (normal/broken)
7. admin ทดลอง flow ลาออก (ตรวจรายการค้าง + คืนทั้งหมด)

## 6) จุดตรวจมาตรฐานโปรเจกต์

- หน้า list เป็นตารางทั้งหมด
- เพิ่ม/แก้ไขผ่าน modal popup
- แสดงวันที่เป็นไทย พ.ศ.
- ไม่ใช้ mock data
- มี log รายละเอียดทั้ง backend/frontend
- ธีมสีโทนร้อน

