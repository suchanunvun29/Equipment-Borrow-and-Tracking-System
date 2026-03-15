# คู่มือการพัฒนาระบบจัดการยืมอุปกรณ์ (Equipment Borrow & Tracking System)

> **Stack:** Next.js + Tailwind CSS (Frontend) | C# .NET 9 (Backend API) | PostgreSQL (Database)  
> **Author:** น.ส.สุชานันท์ จันทรจามร

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [โครงสร้างโปรเจกต์](#2-โครงสร้างโปรเจกต์)
3. [Database Schema](#3-database-schema)
4. [Backend API (.NET 9)](#4-backend-api-net-9)
5. [Frontend (Next.js + Tailwind)](#5-frontend-nextjs--tailwind)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Business Logic Flow](#7-business-logic-flow)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [การติดตั้งและ Setup](#9-การติดตั้งและ-setup)
10. [Environment Variables](#10-environment-variables)

---

## 1. ภาพรวมระบบ

ระบบจัดการยืม-คืนอุปกรณ์ภายในองค์กร แก้ปัญหากระบวนการด้วยมือ (Manual Process) ที่ยึดติดกับตัวบุคคล สูญหายของข้อมูลประวัติ และข้อมูลที่ผิดพลาด

### ผู้ใช้งาน (User Roles)

| Role  | สิทธิ์                                                                                       |
|-------|----------------------------------------------------------------------------------------------|
| Admin | อนุมัติการยืม, จัดการอุปกรณ์, จัดการพนักงาน, ดูรายงานทั้งหมด, อนุมัติการคืน              |
| Staff | ส่งคำขอยืมอุปกรณ์, ดูสถานะการยืมของตนเอง, ดูประวัติการยืม-คืนของตนเอง                   |

### Flow หลักของระบบ

```
เริ่มต้น → ลงทะเบียน/Login → แยกบทบาท (Admin/Staff)
  Staff  → เลือกอุปกรณ์ (ตรวจสต็อก) → ส่งคำขอยืม → รอการอนุมัติ
  Admin  → ตรวจสอบคำขอ → อนุมัติ/ไม่อนุมัติ
         → จัดการอุปกรณ์ (เพิ่ม/แก้ไข)
         → อนุมัติการคืน (ระบุสาเหตุ: ปกติ/ลาออก/พัง)
→ บันทึกข้อมูลลง Report → จบการทำงาน
```

---

## 2. โครงสร้างโปรเจกต์

```
equipment-borrow/
├── backend/                        # C# .NET 9 Web API
│   ├── EquipmentBorrow.API/
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── EquipmentController.cs
│   │   │   ├── BorrowController.cs
│   │   │   ├── ReturnController.cs
│   │   │   ├── EmployeeController.cs
│   │   │   └── ReportController.cs
│   │   ├── Models/
│   │   │   ├── Entities/
│   │   │   │   ├── User.cs
│   │   │   │   ├── Equipment.cs
│   │   │   │   ├── BorrowRequest.cs
│   │   │   │   └── ReturnRecord.cs
│   │   │   └── DTOs/
│   │   │       ├── Auth/
│   │   │       ├── Equipment/
│   │   │       ├── Borrow/
│   │   │       └── Return/
│   │   ├── Services/
│   │   │   ├── IAuthService.cs / AuthService.cs
│   │   │   ├── IEquipmentService.cs / EquipmentService.cs
│   │   │   ├── IBorrowService.cs / BorrowService.cs
│   │   │   └── IReportService.cs / ReportService.cs
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Middleware/
│   │   │   └── JwtMiddleware.cs
│   │   ├── appsettings.json
│   │   └── Program.cs
│   └── EquipmentBorrow.sln
│
├── frontend/                       # Next.js 14+ App Router
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Sidebar layout
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── employees/page.tsx
│   │   │   ├── equipment/page.tsx
│   │   │   ├── borrow/page.tsx
│   │   │   ├── return/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── SearchInput.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── features/
│   │       ├── equipment/
│   │       ├── borrow/
│   │       └── return/
│   ├── lib/
│   │   ├── api.ts                  # Axios/fetch wrapper
│   │   └── auth.ts                 # Auth helpers
│   ├── types/
│   │   └── index.ts
│   ├── tailwind.config.ts
│   └── next.config.ts
│
└── docker-compose.yml              # PostgreSQL + pgAdmin
```

---

## 3. Database Schema

### ER Diagram Overview

```
Users ──< BorrowRequests >── Equipment
  │              │
  │         ReturnRecords
  │
EmployeeProfiles
```

### SQL Schema

```sql
-- ===========================
-- Users & Auth
-- ===========================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,           -- BCrypt hash
    full_name   VARCHAR(200) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    department  VARCHAR(100),
    role        VARCHAR(20) NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Equipment Categories
-- ===========================
CREATE TABLE equipment_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Equipment
-- ===========================
CREATE TABLE equipment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,    -- e.g. IT-LPT-001
    name            VARCHAR(200) NOT NULL,
    category_id     UUID REFERENCES equipment_categories(id),
    model           VARCHAR(100),
    total_quantity  INT NOT NULL DEFAULT 1,
    available_qty   INT NOT NULL DEFAULT 1,
    status          VARCHAR(30) DEFAULT 'available', -- 'available' | 'out_of_stock'
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Borrow Requests
-- ===========================
CREATE TABLE borrow_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code    VARCHAR(50) UNIQUE,             -- Auto-generated
    borrower_id     UUID NOT NULL REFERENCES users(id),
    equipment_id    UUID NOT NULL REFERENCES equipment(id),
    borrow_date     DATE NOT NULL,
    expected_return DATE,
    status          VARCHAR(30) DEFAULT 'pending',
    -- 'pending' | 'approved' | 'rejected' | 'returned'
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Return Records
-- ===========================
CREATE TABLE return_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrow_id       UUID NOT NULL REFERENCES borrow_requests(id),
    returned_by     UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    return_date     DATE NOT NULL,
    return_reason   VARCHAR(30) NOT NULL DEFAULT 'normal',
    -- 'normal' | 'resigned' | 'broken' | 'other'
    condition_note  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Indexes
-- ===========================
CREATE INDEX idx_borrow_borrower ON borrow_requests(borrower_id);
CREATE INDEX idx_borrow_status   ON borrow_requests(status);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_return_borrow   ON return_records(borrow_id);
```

---

## 4. Backend API (.NET 9)

### 4.1 Program.cs (Entry Point)

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true
        };
    });

// Authorization Policies
builder.Services.AddAuthorization(options => {
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
    options.AddPolicy("StaffAndAdmin", policy => policy.RequireRole("admin", "staff"));
});

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Services DI
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IBorrowService, BorrowService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<IReportService, ReportService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### 4.2 AppDbContext.cs

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<EquipmentCategory> EquipmentCategories => Set<EquipmentCategory>();
    public DbSet<BorrowRequest> BorrowRequests => Set<BorrowRequest>();
    public DbSet<ReturnRecord> ReturnRecords => Set<ReturnRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Enum conversions
        modelBuilder.Entity<BorrowRequest>()
            .Property(b => b.Status)
            .HasConversion<string>();

        modelBuilder.Entity<ReturnRecord>()
            .Property(r => r.ReturnReason)
            .HasConversion<string>();

        // Auto-update timestamps
        modelBuilder.Entity<User>()
            .Property(u => u.UpdatedAt)
            .ValueGeneratedOnAddOrUpdate();
    }
}
```

### 4.3 Entities

```csharp
// Models/Entities/Equipment.cs
public class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public EquipmentCategory? Category { get; set; }
    public string? Model { get; set; }
    public int TotalQuantity { get; set; } = 1;
    public int AvailableQty { get; set; } = 1;
    public string Status { get; set; } = "available";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<BorrowRequest> BorrowRequests { get; set; } = new List<BorrowRequest>();
}

// Models/Entities/BorrowRequest.cs
public class BorrowRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? RequestCode { get; set; }
    public Guid BorrowerId { get; set; }
    public User? Borrower { get; set; }
    public Guid EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public DateOnly BorrowDate { get; set; }
    public DateOnly? ExpectedReturn { get; set; }
    public string Status { get; set; } = "pending";
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ReturnRecord? ReturnRecord { get; set; }
}
```

### 4.4 BorrowService (ตัวอย่าง Business Logic)

```csharp
public class BorrowService : IBorrowService
{
    private readonly AppDbContext _db;
    public BorrowService(AppDbContext db) => _db = db;

    public async Task<BorrowRequest> CreateBorrowRequestAsync(CreateBorrowDto dto, Guid borrowerId)
    {
        // ตรวจสอบสต็อกอุปกรณ์
        var equipment = await _db.Equipment.FindAsync(dto.EquipmentId)
            ?? throw new NotFoundException("Equipment not found");

        if (equipment.AvailableQty <= 0)
            throw new BusinessException("Equipment out of stock");

        var request = new BorrowRequest {
            BorrowerId   = borrowerId,
            EquipmentId  = dto.EquipmentId,
            BorrowDate   = dto.BorrowDate,
            ExpectedReturn = dto.ExpectedReturn,
            RequestCode  = GenerateRequestCode(),
            Status       = "pending"
        };

        _db.BorrowRequests.Add(request);
        await _db.SaveChangesAsync();
        return request;
    }

    public async Task<BorrowRequest> ApproveBorrowAsync(Guid requestId, Guid adminId)
    {
        var request = await _db.BorrowRequests
            .Include(b => b.Equipment)
            .FirstOrDefaultAsync(b => b.Id == requestId)
            ?? throw new NotFoundException("Request not found");

        if (request.Status != "pending")
            throw new BusinessException("Request is not in pending status");

        if (request.Equipment!.AvailableQty <= 0)
            throw new BusinessException("Equipment no longer available");

        // ลดจำนวนสต็อก
        request.Equipment.AvailableQty--;
        if (request.Equipment.AvailableQty == 0)
            request.Equipment.Status = "out_of_stock";

        request.Status     = "approved";
        request.ApprovedBy = adminId;
        request.ApprovedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return request;
    }

    public async Task<ReturnRecord> ProcessReturnAsync(ProcessReturnDto dto, Guid adminId)
    {
        var borrow = await _db.BorrowRequests
            .Include(b => b.Equipment)
            .FirstOrDefaultAsync(b => b.Id == dto.BorrowId)
            ?? throw new NotFoundException("Borrow request not found");

        if (borrow.Status != "approved")
            throw new BusinessException("Cannot return unapproved request");

        var returnRecord = new ReturnRecord {
            BorrowId      = dto.BorrowId,
            ApprovedBy    = adminId,
            ReturnDate    = dto.ReturnDate,
            ReturnReason  = dto.ReturnReason,
            ConditionNote = dto.ConditionNote
        };

        // คืนสต็อกถ้าไม่ใช่กรณีพัง
        if (dto.ReturnReason != "broken")
        {
            borrow.Equipment!.AvailableQty++;
            borrow.Equipment.Status = "available";
        }

        borrow.Status = "returned";

        _db.ReturnRecords.Add(returnRecord);
        await _db.SaveChangesAsync();
        return returnRecord;
    }

    private static string GenerateRequestCode()
        => $"BR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
}
```

### 4.5 AuthController

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result is null) return Unauthorized(new { message = "Invalid credentials" });
        return Ok(result);
    }
}
```

---

## 5. Frontend (Next.js + Tailwind)

### 5.1 การตั้งค่า Tailwind

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D4A6B',
          dark:    '#1E3450',
          light:   '#4A6FA5',
        },
        sidebar: '#2D4A6B',
        surface: '#F0F4F8',
      },
    },
  },
} satisfies Config
```

### 5.2 Types

```typescript
// types/index.ts
export type UserRole = 'admin' | 'staff'

export interface User {
  id: string
  username: string
  fullName: string
  employeeCode: string
  department: string
  role: UserRole
}

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned'
export type ReturnReason = 'normal' | 'resigned' | 'broken' | 'other'

export interface Equipment {
  id: string
  code: string
  name: string
  category: EquipmentCategory
  model: string
  totalQuantity: number
  availableQty: number
  status: 'available' | 'out_of_stock'
}

export interface BorrowRequest {
  id: string
  requestCode: string
  borrower: User
  equipment: Equipment
  borrowDate: string
  expectedReturn?: string
  status: BorrowStatus
  approvedBy?: User
  approvedAt?: string
  returnRecord?: ReturnRecord
}

export interface ReturnRecord {
  id: string
  returnDate: string
  returnReason: ReturnReason
  conditionNote?: string
}
```

### 5.3 API Client

```typescript
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

async function fetchWithAuth(path: string, init?: RequestInit) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') : null

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    login:    (data: { username: string; password: string }) =>
                fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: unknown) =>
                fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  equipment: {
    list:   (params?: string) => fetchWithAuth(`/equipment?${params ?? ''}`),
    create: (data: unknown)   => fetchWithAuth('/equipment', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
              fetchWithAuth(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/equipment/${id}`, { method: 'DELETE' }),
  },
  borrow: {
    list:    (params?: string)   => fetchWithAuth(`/borrow?${params ?? ''}`),
    create:  (data: unknown)     => fetchWithAuth('/borrow', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: string)        => fetchWithAuth(`/borrow/${id}/approve`, { method: 'POST' }),
    reject:  (id: string, note?: string) =>
               fetchWithAuth(`/borrow/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
  },
  return: {
    list:    (params?: string) => fetchWithAuth(`/return?${params ?? ''}`),
    process: (data: unknown)   => fetchWithAuth('/return', { method: 'POST', body: JSON.stringify(data) }),
  },
  reports: {
    summary:   () => fetchWithAuth('/reports/summary'),
    byPeriod:  (from: string, to: string) => fetchWithAuth(`/reports/period?from=${from}&to=${to}`),
  },
}
```

### 5.4 Dashboard Page (ตัวอย่าง)

```tsx
// app/(dashboard)/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface DashboardSummary {
  totalEquipment: number
  currentBorrowed: number
  overdueCount: number
  pendingApproval: number
  recentActivities: Activity[]
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    api.reports.summary().then(setSummary)
  }, [])

  const cards = [
    { label: 'อุปกรณ์ทั้งหมด',   value: summary?.totalEquipment,   color: 'bg-blue-50' },
    { label: 'การยืมปัจจุบัน',   value: summary?.currentBorrowed,  color: 'bg-green-50' },
    { label: 'เกินกำหนด',         value: summary?.overdueCount,     color: 'bg-red-50' },
    { label: 'รออนุมัติ',         value: summary?.pendingApproval,  color: 'bg-orange-50' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แดชบอร์ด</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${c.color} rounded-2xl p-6 shadow-sm`}>
            <p className="text-gray-600 text-sm">{c.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {c.value ?? '—'} <span className="text-base font-normal">หน่วย</span>
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h2 className="font-semibold mb-3">กิจกรรมล่าสุด</h2>
        {summary?.recentActivities.map((a) => (
          <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-sm text-gray-700">{a.equipmentName}</span>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5.5 Sidebar Layout

```tsx
// components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href: '/dashboard',  label: 'แดชบอร์ด' },
  { href: '/employees',  label: 'พนักงาน',           adminOnly: true },
  { href: '/equipment',  label: 'อุปกรณ์',           adminOnly: true },
  { href: '/borrow',     label: 'การยืม' },
  { href: '/return',     label: 'การคืน',            adminOnly: true },
  { href: '/history',    label: 'ประวัติการยืม/คืน' },
  { href: '/reports',    label: 'รายงาน',            adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filtered = navItems.filter(item => !item.adminOnly || user?.role === 'admin')

  return (
    <aside className="w-64 min-h-screen bg-[#2D4A6B] flex flex-col">
      <div className="p-6 text-white font-bold text-lg border-b border-white/10">
        Equipment Borrow
      </div>
      <nav className="flex-1 py-4">
        {filtered.map((item) => (
          <Link key={item.href} href={item.href}
            className={`block px-6 py-3 text-sm font-medium transition-colors
              ${pathname === item.href
                ? 'bg-blue-200/20 text-white border-r-4 border-blue-300'
                : 'text-blue-100 hover:bg-white/10'}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

### 5.6 StatusBadge Component

```tsx
// components/ui/Badge.tsx
import type { BorrowStatus } from '@/types'

const config: Record<BorrowStatus, { label: string; className: string }> = {
  pending:  { label: 'รออนุมัติ',    className: 'bg-orange-100 text-orange-700' },
  approved: { label: 'ยืนยัน',       className: 'bg-green-100 text-green-700' },
  rejected: { label: 'ยกเลิก',       className: 'bg-red-100 text-red-700' },
  returned: { label: 'คืนเสร็จสิ้น', className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: BorrowStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
```

---

## 6. Authentication & Authorization

### JWT Flow

```
1. POST /api/auth/login  →  { token, refreshToken, user }
2. เก็บ token ใน localStorage / httpOnly cookie
3. ทุก request แนบ Authorization: Bearer <token>
4. Backend ตรวจสอบ JWT → ดึง UserId + Role จาก Claims
5. [Authorize(Policy = "AdminOnly")] → ตรวจ Role: admin
```

### AuthService.cs (ตัวอย่าง)

```csharp
public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return null;

        return new LoginResponseDto {
            Token = GenerateJwt(user),
            User  = MapToDto(user)
        };
    }

    private string GenerateJwt(User user)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name,           user.Username),
            new Claim(ClaimTypes.Role,           user.Role),
        };

        var token = new JwtSecurityToken(
            issuer:    _config["JwtSettings:Issuer"],
            audience:  _config["JwtSettings:Audience"],
            claims:    claims,
            expires:   DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## 7. Business Logic Flow

### 7.1 การยืมอุปกรณ์ (Staff)

```
Staff กดยืม
  → ตรวจสอบ available_qty > 0
      ├─ ไม่ → แสดง "ไม่มีอุปกรณ์ว่าง"
      └─ มี  → สร้าง BorrowRequest (status: pending)
               → แสดง "รอการอนุมัติ"
```

### 7.2 การอนุมัติยืม (Admin)

```
Admin เห็นรายการ pending
  → ตรวจสอบคำขอ
      ├─ อนุมัติ  → status: approved, available_qty--, บันทึก Report
      └─ ไม่อนุมัติ → status: rejected, บันทึก Report
```

### 7.3 การคืนอุปกรณ์ (Admin)

```
Admin อนุมัติการคืน
  → ระบุสาเหตุการคืน
      ├─ ปกติ / ลาออก  → status: returned, available_qty++, บันทึก Report
      └─ ซ่อม/พัง      → status: returned, available_qty ไม่เพิ่ม (ส่งซ่อม)
```

### 7.4 การตรวจสอบเมื่อพนักงานลาออก

```
Admin เลือก "ลาออก" ในหน้าการคืน
  → ระบบ query BorrowRequests ที่ status = 'approved' ของพนักงานคนนั้น
  → ถ้ายังมีรายการค้างอยู่ → แสดงรายการทั้งหมด ให้ Admin ยืนยันรับคืน
  → บันทึก return_reason = 'resigned' สำหรับทุกรายการ
```

---

## 8. API Endpoints Reference

### Auth

| Method | Endpoint            | Auth  | Description         |
|--------|---------------------|-------|---------------------|
| POST   | /api/auth/register  | -     | ลงทะเบียนผู้ใช้     |
| POST   | /api/auth/login     | -     | เข้าสู่ระบบ          |

### Equipment

| Method | Endpoint              | Auth        | Description           |
|--------|-----------------------|-------------|-----------------------|
| GET    | /api/equipment        | Staff+      | รายการอุปกรณ์ทั้งหมด |
| GET    | /api/equipment/{id}   | Staff+      | รายละเอียดอุปกรณ์     |
| POST   | /api/equipment        | Admin       | เพิ่มอุปกรณ์          |
| PUT    | /api/equipment/{id}   | Admin       | แก้ไขอุปกรณ์          |
| DELETE | /api/equipment/{id}   | Admin       | ลบอุปกรณ์             |

### Borrow

| Method | Endpoint                    | Auth   | Description           |
|--------|-----------------------------|--------|-----------------------|
| GET    | /api/borrow                 | Staff+ | รายการขอยืม           |
| GET    | /api/borrow/{id}            | Staff+ | รายละเอียดการขอยืม    |
| POST   | /api/borrow                 | Staff+ | สร้างคำขอยืม          |
| POST   | /api/borrow/{id}/approve    | Admin  | อนุมัติการยืม         |
| POST   | /api/borrow/{id}/reject     | Admin  | ปฏิเสธการยืม          |

### Return

| Method | Endpoint              | Auth  | Description           |
|--------|-----------------------|-------|-----------------------|
| GET    | /api/return           | Admin | รายการรอการคืน        |
| POST   | /api/return           | Admin | บันทึกการคืน          |

### Reports

| Method | Endpoint                | Auth  | Description                  |
|--------|-------------------------|-------|------------------------------|
| GET    | /api/reports/summary    | Admin | สรุปภาพรวมระบบ               |
| GET    | /api/reports/period     | Admin | รายงานตามช่วงเวลา            |
| GET    | /api/reports/equipment  | Admin | รายงานอุปกรณ์ทั้งหมด         |
| GET    | /api/reports/overdue    | Admin | รายงานอุปกรณ์เกินกำหนด       |

---

## 9. การติดตั้งและ Setup

### Prerequisites

- .NET 9 SDK
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (หรือใช้ Docker)

### 1. เริ่มต้น Database ด้วย Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: equipment_borrow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  pg_data:
```

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend/EquipmentBorrow.API

# Restore packages
dotnet restore

# Run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run API
dotnet run
# API จะรันที่ https://localhost:5001
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# สร้าง .env.local
cp .env.example .env.local

# Run development server
npm run dev
# Frontend จะรันที่ http://localhost:3000
```

---

## 10. Environment Variables

### Backend: appsettings.Development.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=equipment_borrow;Username=postgres;Password=postgres123"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyAtLeast32CharactersLong!",
    "Issuer": "EquipmentBorrowAPI",
    "Audience": "EquipmentBorrowApp",
    "ExpiryHours": 8
  },
  "AllowedOrigins": "http://localhost:3000"
}
```

### Frontend: .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_NAME=Equipment Borrow System
```

---

## หมายเหตุการพัฒนา

- **Validation:** ใช้ FluentValidation บน Backend, Zod บน Frontend
- **Error Handling:** Global Exception Middleware บน .NET, try-catch + toast notification บน Next.js
- **Pagination:** ทุก list endpoint ควรรองรับ `?page=1&pageSize=20`
- **Soft Delete:** ใช้ `is_active` flag แทนการลบจริงสำหรับ Users และ Equipment
- **Audit Log:** บันทึก `created_by`, `updated_by` ในทุก entity สำคัญ

---

*คู่มือนี้ครอบคลุม Architecture, Database Schema, Backend API, Frontend Components และ Business Logic ของระบบ Equipment Borrow & Tracking System เวอร์ชัน 1.0*
