using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Auth;
using EquipmentBorrow.API.Models.DTOs.Borrow;
using EquipmentBorrow.API.Models.DTOs.Return;
using EquipmentBorrow.API.Models.Entities;
using EquipmentBorrow.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EquipmentBorrow.API.Tests;

public class FlowAndAuthTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration CreateConfig() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "YourSuperSecretKeyAtLeast32CharactersLong!",
            ["JwtSettings:Issuer"] = "EquipmentBorrowAPI",
            ["JwtSettings:Audience"] = "EquipmentBorrowApp",
            ["JwtSettings:ExpiryHours"] = "8",
        })
        .Build();

    [Fact]
    public async Task Flow_Login_Borrow_Approve_Return_ShouldSuccess()
    {
        await using var db = CreateDbContext(nameof(Flow_Login_Borrow_Approve_Return_ShouldSuccess));

        var authService = new AuthService(db, CreateConfig(), NullLogger<AuthService>.Instance);
        var borrowService = new BorrowService(db, NullLogger<BorrowService>.Instance);
        var returnService = new ReturnService(db, NullLogger<ReturnService>.Instance);

        var admin = new User
        {
            Username = "admin.flow",
            Password = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName = "แอดมินทดสอบ",
            Role = "admin",
            IsActive = true,
        };
        db.Users.Add(admin);

        var equipment = new Equipment
        {
            Code = "IT-TST-100",
            Name = "Tablet",
            TotalQuantity = 1,
            AvailableQty = 1,
            Status = "available",
        };
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync();

        var registered = await authService.RegisterAsync(new RegisterDto
        {
            Username = "staff.flow",
            Password = "staff123",
            FullName = "พนักงานทดสอบ",
            Department = "IT",
        });

        var login = await authService.LoginAsync(new LoginDto
        {
            Username = "staff.flow",
            Password = "staff123",
        });

        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.Token));

        var borrowResult = await borrowService.CreateAsync(registered.Id, new CreateBorrowDto
        {
            EquipmentId = equipment.Id,
            BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ExpectedReturn = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
        });

        var borrowId = (Guid)borrowResult.GetType().GetProperty("Id")!.GetValue(borrowResult)!;

        await borrowService.ApproveAsync(borrowId, admin.Id);

        var returnResult = await returnService.ProcessAsync(admin.Id, new ProcessReturnDto
        {
            BorrowId = borrowId,
            ReturnDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ReturnReason = "normal",
        });

        Assert.NotNull(returnResult);

        var updatedBorrow = await db.BorrowRequests.Include(b => b.Equipment).FirstAsync(b => b.Id == borrowId);
        Assert.Equal("returned", updatedBorrow.Status);
        Assert.Equal(1, updatedBorrow.Equipment!.AvailableQty);
    }

    [Fact]
    public async Task Flow_Borrow_Reject_ShouldBeRejected()
    {
        await using var db = CreateDbContext(nameof(Flow_Borrow_Reject_ShouldBeRejected));

        var borrowService = new BorrowService(db, NullLogger<BorrowService>.Instance);

        var admin = new User
        {
            Username = "admin.reject",
            Password = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName = "แอดมินปฏิเสธ",
            Role = "admin",
            IsActive = true,
        };

        var staff = new User
        {
            Username = "staff.reject",
            Password = BCrypt.Net.BCrypt.HashPassword("staff123"),
            FullName = "พนักงานปฏิเสธ",
            Role = "staff",
            IsActive = true,
        };

        var equipment = new Equipment
        {
            Code = "IT-TST-200",
            Name = "Projector",
            TotalQuantity = 1,
            AvailableQty = 1,
            Status = "available",
        };

        db.Users.AddRange(admin, staff);
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync();

        var created = await borrowService.CreateAsync(staff.Id, new CreateBorrowDto
        {
            EquipmentId = equipment.Id,
            BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow),
        });

        var borrowId = (Guid)created.GetType().GetProperty("Id")!.GetValue(created)!;

        await borrowService.RejectAsync(borrowId, admin.Id, "ไม่ผ่านเงื่อนไข");

        var updatedBorrow = await db.BorrowRequests.FirstAsync(b => b.Id == borrowId);
        Assert.Equal("rejected", updatedBorrow.Status);
        Assert.Equal("ไม่ผ่านเงื่อนไข", updatedBorrow.Notes);
    }
}
