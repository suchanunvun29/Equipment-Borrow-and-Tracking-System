using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Borrow;
using EquipmentBorrow.API.Models.DTOs.Return;
using EquipmentBorrow.API.Models.Entities;
using EquipmentBorrow.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EquipmentBorrow.API.Tests;

public class BusinessFlowTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateBorrow_WhenOutOfStock_ShouldThrowDomainException()
    {
        await using var db = CreateDbContext(nameof(CreateBorrow_WhenOutOfStock_ShouldThrowDomainException));

        var user = new User
        {
            Username = "staff1",
            Password = "hash",
            FullName = "พนักงานหนึ่ง",
            Role = "staff",
        };

        var equipment = new Equipment
        {
            Code = "IT-LPT-001",
            Name = "Laptop",
            TotalQuantity = 1,
            AvailableQty = 0,
            Status = "out_of_stock",
        };

        db.Users.Add(user);
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync();

        var service = new BorrowService(db, NullLogger<BorrowService>.Instance);

        await Assert.ThrowsAsync<DomainException>(() => service.CreateAsync(user.Id, new CreateBorrowDto
        {
            EquipmentId = equipment.Id,
            BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow),
        }));
    }

    [Fact]
    public async Task ApproveBorrow_ShouldDecreaseAvailableQty()
    {
        await using var db = CreateDbContext(nameof(ApproveBorrow_ShouldDecreaseAvailableQty));

        var admin = new User { Username = "admin1", Password = "hash", FullName = "แอดมิน", Role = "admin" };
        var staff = new User { Username = "staff2", Password = "hash", FullName = "พนักงานสอง", Role = "staff" };
        var equipment = new Equipment
        {
            Code = "IT-MNT-001",
            Name = "Monitor",
            TotalQuantity = 2,
            AvailableQty = 2,
            Status = "available",
        };

        db.Users.AddRange(admin, staff);
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync();

        var borrow = new BorrowRequest
        {
            BorrowerId = staff.Id,
            EquipmentId = equipment.Id,
            BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = "pending",
            RequestCode = "BR-TEST-001",
        };

        db.BorrowRequests.Add(borrow);
        await db.SaveChangesAsync();

        var service = new BorrowService(db, NullLogger<BorrowService>.Instance);
        await service.ApproveAsync(borrow.Id, admin.Id);

        var updatedBorrow = await db.BorrowRequests.Include(b => b.Equipment).FirstAsync(b => b.Id == borrow.Id);
        Assert.Equal("approved", updatedBorrow.Status);
        Assert.NotNull(updatedBorrow.Equipment);
        Assert.Equal(1, updatedBorrow.Equipment!.AvailableQty);
    }

    [Fact]
    public async Task ProcessReturn_Normal_ShouldIncreaseAvailableQty()
    {
        await using var db = CreateDbContext(nameof(ProcessReturn_Normal_ShouldIncreaseAvailableQty));

        var admin = new User { Username = "admin2", Password = "hash", FullName = "แอดมินสอง", Role = "admin" };
        var staff = new User { Username = "staff3", Password = "hash", FullName = "พนักงานสาม", Role = "staff" };
        var equipment = new Equipment
        {
            Code = "IT-KBD-001",
            Name = "Keyboard",
            TotalQuantity = 1,
            AvailableQty = 0,
            Status = "out_of_stock",
        };

        db.Users.AddRange(admin, staff);
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync();

        var borrow = new BorrowRequest
        {
            BorrowerId = staff.Id,
            EquipmentId = equipment.Id,
            BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
            Status = "approved",
            RequestCode = "BR-TEST-002",
            ApprovedBy = admin.Id,
            ApprovedAt = DateTime.UtcNow.AddDays(-2),
        };

        db.BorrowRequests.Add(borrow);
        await db.SaveChangesAsync();

        var service = new ReturnService(db, NullLogger<ReturnService>.Instance);
        await service.ProcessAsync(admin.Id, new ProcessReturnDto
        {
            BorrowId = borrow.Id,
            ReturnDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ReturnReason = "normal",
        });

        var updatedBorrow = await db.BorrowRequests.Include(b => b.Equipment).FirstAsync(b => b.Id == borrow.Id);
        Assert.Equal("returned", updatedBorrow.Status);
        Assert.Equal(1, updatedBorrow.Equipment!.AvailableQty);
        Assert.Equal("available", updatedBorrow.Equipment.Status);
    }

    [Fact]
    public async Task ProcessResignedByEmployee_ShouldReturnAllOutstanding()
    {
        await using var db = CreateDbContext(nameof(ProcessResignedByEmployee_ShouldReturnAllOutstanding));

        var admin = new User { Username = "admin3", Password = "hash", FullName = "แอดมินสาม", Role = "admin" };
        var staff = new User { Username = "staff4", Password = "hash", FullName = "พนักงานสี่", Role = "staff" };

        var eq1 = new Equipment { Code = "IT-MSE-001", Name = "Mouse", TotalQuantity = 1, AvailableQty = 0, Status = "out_of_stock" };
        var eq2 = new Equipment { Code = "IT-HDP-001", Name = "Headphone", TotalQuantity = 1, AvailableQty = 0, Status = "out_of_stock" };

        db.Users.AddRange(admin, staff);
        db.Equipment.AddRange(eq1, eq2);
        await db.SaveChangesAsync();

        db.BorrowRequests.AddRange(
            new BorrowRequest
            {
                BorrowerId = staff.Id,
                EquipmentId = eq1.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-3)),
                Status = "approved",
                RequestCode = "BR-TEST-003"
            },
            new BorrowRequest
            {
                BorrowerId = staff.Id,
                EquipmentId = eq2.Id,
                BorrowDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
                Status = "approved",
                RequestCode = "BR-TEST-004"
            }
        );

        await db.SaveChangesAsync();

        var service = new ReturnService(db, NullLogger<ReturnService>.Instance);

        await service.ProcessResignedByEmployeeAsync(admin.Id, staff.Id, new ProcessResignedReturnDto
        {
            ReturnDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ConditionNote = "คืนจากกรณีลาออก",
        });

        var outstanding = await db.BorrowRequests.CountAsync(b => b.BorrowerId == staff.Id && b.Status == "approved");
        var returned = await db.BorrowRequests.CountAsync(b => b.BorrowerId == staff.Id && b.Status == "returned");

        Assert.Equal(0, outstanding);
        Assert.Equal(2, returned);

        var returnRecords = await db.ReturnRecords.Where(r => r.ReturnReason == "resigned").CountAsync();
        Assert.Equal(2, returnRecords);
    }
}
