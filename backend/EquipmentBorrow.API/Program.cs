using System.Text;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Middleware;
using EquipmentBorrow.API.Models.Entities;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is required");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
    options.AddPolicy("StaffAndAdmin", policy => policy.RequireRole("admin", "staff"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origin = builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000";
        policy.WithOrigins(origin, "http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISystemUsageLogService, SystemUsageLogService>();
builder.Services.AddScoped<IEquipmentCategoryService, EquipmentCategoryService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IBorrowService, BorrowService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<IReportService, ReportService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

    try
    {
        await db.Database.MigrateAsync();
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "SystemUsageLogs" (
                "Id" uuid NOT NULL,
                "UserId" uuid NULL,
                "Username" text NOT NULL,
                "Role" text NOT NULL,
                "Method" text NOT NULL,
                "Path" text NOT NULL,
                "StatusCode" integer NOT NULL,
                "DurationMs" bigint NOT NULL,
                "Detail" text NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_SystemUsageLogs" PRIMARY KEY ("Id")
            );
            CREATE INDEX IF NOT EXISTS "IX_SystemUsageLogs_CreatedAt" ON "SystemUsageLogs" ("CreatedAt");
            CREATE INDEX IF NOT EXISTS "IX_SystemUsageLogs_Username" ON "SystemUsageLogs" ("Username");
            """);

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser is null)
        {
            adminUser = new User
            {
                Username = "admin",
                Password = BCrypt.Net.BCrypt.HashPassword("password"),
                FullName = "ผู้ดูแลระบบ",
                EmployeeCode = "ADMIN001",
                Department = "IT",
                Role = "admin",
                IsActive = true,
            };

            db.Users.Add(adminUser);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างผู้ใช้เริ่มต้นสำเร็จ Username={Username}", adminUser.Username);
        }

        var staff01 = await db.Users.FirstOrDefaultAsync(u => u.Username == "staff01");
        if (staff01 is null)
        {
            staff01 = new User
            {
                Username = "staff01",
                Password = BCrypt.Net.BCrypt.HashPassword("password"),
                FullName = "พนักงานทดสอบ 01",
                EmployeeCode = "STF001",
                Department = "IT Support",
                Role = "staff",
                IsActive = true,
            };
            db.Users.Add(staff01);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างผู้ใช้ตัวอย่างสำเร็จ Username={Username}", staff01.Username);
        }

        var staff02 = await db.Users.FirstOrDefaultAsync(u => u.Username == "staff02");
        if (staff02 is null)
        {
            staff02 = new User
            {
                Username = "staff02",
                Password = BCrypt.Net.BCrypt.HashPassword("password"),
                FullName = "พนักงานทดสอบ 02",
                EmployeeCode = "STF002",
                Department = "Finance",
                Role = "staff",
                IsActive = true,
            };
            db.Users.Add(staff02);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างผู้ใช้ตัวอย่างสำเร็จ Username={Username}", staff02.Username);
        }

        var categoryNotebook = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "โน้ตบุ๊ก");
        if (categoryNotebook is null)
        {
            categoryNotebook = new EquipmentCategory
            {
                Name = "โน้ตบุ๊ก",
                Description = "อุปกรณ์คอมพิวเตอร์พกพา",
            };
            db.EquipmentCategories.Add(categoryNotebook);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างหมวดหมู่อุปกรณ์ตัวอย่างสำเร็จ Name={CategoryName}", categoryNotebook.Name);
        }

        var categoryNetwork = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "อุปกรณ์เครือข่าย");
        if (categoryNetwork is null)
        {
            categoryNetwork = new EquipmentCategory
            {
                Name = "อุปกรณ์เครือข่าย",
                Description = "อุปกรณ์สำหรับการเชื่อมต่อเครือข่าย",
            };
            db.EquipmentCategories.Add(categoryNetwork);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างหมวดหมู่อุปกรณ์ตัวอย่างสำเร็จ Name={CategoryName}", categoryNetwork.Name);
        }

        var categoryMonitor = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "จอภาพ");
        if (categoryMonitor is null)
        {
            categoryMonitor = new EquipmentCategory
            {
                Name = "จอภาพ",
                Description = "จอภาพสำหรับงานสำนักงานและงานพัฒนา",
            };
            db.EquipmentCategories.Add(categoryMonitor);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างหมวดหมู่อุปกรณ์ตัวอย่างสำเร็จ Name={CategoryName}", categoryMonitor.Name);
        }

        var categoryAccessory = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "อุปกรณ์เสริม");
        if (categoryAccessory is null)
        {
            categoryAccessory = new EquipmentCategory
            {
                Name = "อุปกรณ์เสริม",
                Description = "อุปกรณ์ประกอบการทำงาน เช่น เมาส์ คีย์บอร์ด และแท่นวาง",
            };
            db.EquipmentCategories.Add(categoryAccessory);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างหมวดหมู่อุปกรณ์ตัวอย่างสำเร็จ Name={CategoryName}", categoryAccessory.Name);
        }

        var notebook01 = await db.Equipment.FirstOrDefaultAsync(e => e.Code == "IT-LPT-001");
        if (notebook01 is null)
        {
            notebook01 = new Equipment
            {
                Code = "IT-LPT-001",
                Name = "Notebook Dell Latitude",
                CategoryId = categoryNotebook.Id,
                Model = "Latitude 5440",
                TotalQuantity = 5,
                AvailableQty = 5,
                Status = "available",
                Description = "เครื่องสำหรับพนักงานใช้งานทั่วไป",
            };
            db.Equipment.Add(notebook01);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างอุปกรณ์ตัวอย่างสำเร็จ Code={Code}", notebook01.Code);
        }

        var router01 = await db.Equipment.FirstOrDefaultAsync(e => e.Code == "IT-NET-001");
        if (router01 is null)
        {
            router01 = new Equipment
            {
                Code = "IT-NET-001",
                Name = "Wireless Router",
                CategoryId = categoryNetwork.Id,
                Model = "AX3000",
                TotalQuantity = 10,
                AvailableQty = 9,
                Status = "available",
                Description = "อุปกรณ์เครือข่ายสำหรับใช้งานภายในสำนักงาน",
            };
            db.Equipment.Add(router01);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างอุปกรณ์ตัวอย่างสำเร็จ Code={Code}", router01.Code);
        }

        var monitor01 = await db.Equipment.FirstOrDefaultAsync(e => e.Code == "IT-MON-001");
        if (monitor01 is null)
        {
            monitor01 = new Equipment
            {
                Code = "IT-MON-001",
                Name = "Monitor LG 24 นิ้ว",
                CategoryId = categoryMonitor.Id,
                Model = "LG 24MP400",
                TotalQuantity = 12,
                AvailableQty = 11,
                Status = "available",
                Description = "จอภาพมาตรฐานสำหรับโต๊ะทำงาน",
            };
            db.Equipment.Add(monitor01);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างอุปกรณ์ตัวอย่างสำเร็จ Code={Code}", monitor01.Code);
        }

        var monitor02 = await db.Equipment.FirstOrDefaultAsync(e => e.Code == "IT-MON-002");
        if (monitor02 is null)
        {
            monitor02 = new Equipment
            {
                Code = "IT-MON-002",
                Name = "Monitor Dell 27 นิ้ว",
                CategoryId = categoryMonitor.Id,
                Model = "Dell P2722H",
                TotalQuantity = 6,
                AvailableQty = 6,
                Status = "available",
                Description = "จอภาพสำหรับงานออกแบบและวิเคราะห์ข้อมูล",
            };
            db.Equipment.Add(monitor02);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างอุปกรณ์ตัวอย่างสำเร็จ Code={Code}", monitor02.Code);
        }

        var accessory01 = await db.Equipment.FirstOrDefaultAsync(e => e.Code == "IT-ACC-001");
        if (accessory01 is null)
        {
            accessory01 = new Equipment
            {
                Code = "IT-ACC-001",
                Name = "ชุดเมาส์และคีย์บอร์ดไร้สาย",
                CategoryId = categoryAccessory.Id,
                Model = "Logitech MK545",
                TotalQuantity = 20,
                AvailableQty = 18,
                Status = "available",
                Description = "ชุดอุปกรณ์เสริมสำหรับพนักงานใหม่",
            };
            db.Equipment.Add(accessory01);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างอุปกรณ์ตัวอย่างสำเร็จ Code={Code}", accessory01.Code);
        }

        var borrowReturned = await db.BorrowRequests.FirstOrDefaultAsync(b => b.RequestCode == "BRW-20260301-001");
        if (borrowReturned is null)
        {
            borrowReturned = new BorrowRequest
            {
                RequestCode = "BRW-20260301-001",
                BorrowerId = staff01.Id,
                EquipmentId = notebook01.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                ExpectedReturn = DateOnly.FromDateTime(DateTime.Today.AddDays(-3)),
                Status = "returned",
                ApprovedBy = adminUser.Id,
                ApprovedAt = DateTime.UtcNow.AddDays(-10),
                Notes = "ยืมใช้งานสำหรับการประชุมภายนอก",
            };
            db.BorrowRequests.Add(borrowReturned);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างคำขอยืมตัวอย่างสำเร็จ RequestCode={RequestCode}", borrowReturned.RequestCode);
        }

        var returnReturned = await db.ReturnRecords.FirstOrDefaultAsync(r => r.BorrowId == borrowReturned.Id);
        if (returnReturned is null)
        {
            returnReturned = new ReturnRecord
            {
                BorrowId = borrowReturned.Id,
                ReturnedBy = staff01.Id,
                ApprovedBy = adminUser.Id,
                ReturnDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-4)),
                ReturnReason = "normal",
                ConditionNote = "อุปกรณ์ปกติ",
            };
            db.ReturnRecords.Add(returnReturned);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างรายการคืนอุปกรณ์ตัวอย่างสำเร็จ BorrowId={BorrowId}", borrowReturned.Id);
        }

        var borrowApproved = await db.BorrowRequests.FirstOrDefaultAsync(b => b.RequestCode == "BRW-20260301-002");
        if (borrowApproved is null)
        {
            borrowApproved = new BorrowRequest
            {
                RequestCode = "BRW-20260301-002",
                BorrowerId = staff02.Id,
                EquipmentId = router01.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-2)),
                ExpectedReturn = DateOnly.FromDateTime(DateTime.Today.AddDays(5)),
                Status = "approved",
                ApprovedBy = adminUser.Id,
                ApprovedAt = DateTime.UtcNow.AddDays(-2),
                Notes = "ยืมสำหรับติดตั้งจุดใช้งานชั่วคราว",
            };
            db.BorrowRequests.Add(borrowApproved);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างคำขอยืมตัวอย่างสำเร็จ RequestCode={RequestCode}", borrowApproved.RequestCode);
        }

        var borrowPending = await db.BorrowRequests.FirstOrDefaultAsync(b => b.RequestCode == "BRW-20260301-003");
        if (borrowPending is null)
        {
            borrowPending = new BorrowRequest
            {
                RequestCode = "BRW-20260301-003",
                BorrowerId = staff01.Id,
                EquipmentId = notebook01.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.Today),
                ExpectedReturn = DateOnly.FromDateTime(DateTime.Today.AddDays(7)),
                Status = "pending",
                Notes = "ยืมเพื่อทำงานนอกสถานที่",
            };
            db.BorrowRequests.Add(borrowPending);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างคำขอยืมตัวอย่างสำเร็จ RequestCode={RequestCode}", borrowPending.RequestCode);
        }

        var borrowRejected = await db.BorrowRequests.FirstOrDefaultAsync(b => b.RequestCode == "BRW-20260301-004");
        if (borrowRejected is null)
        {
            borrowRejected = new BorrowRequest
            {
                RequestCode = "BRW-20260301-004",
                BorrowerId = staff02.Id,
                EquipmentId = notebook01.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-1)),
                ExpectedReturn = DateOnly.FromDateTime(DateTime.Today.AddDays(3)),
                Status = "rejected",
                ApprovedBy = adminUser.Id,
                ApprovedAt = DateTime.UtcNow.AddDays(-1),
                Notes = "ปฏิเสธเนื่องจากเอกสารคำขอไม่ครบ",
            };
            db.BorrowRequests.Add(borrowRejected);
            await db.SaveChangesAsync();
            logger.LogInformation("สร้างคำขอยืมตัวอย่างสำเร็จ RequestCode={RequestCode}", borrowRejected.RequestCode);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "เริ่มต้นระบบฐานข้อมูลไม่สำเร็จ");
        throw;
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SystemUsageLogMiddleware>();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();


