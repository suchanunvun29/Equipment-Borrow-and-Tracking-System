using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Return;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class ReturnService(AppDbContext db, ILogger<ReturnService> logger) : IReturnService
{
    public async Task<IReadOnlyList<object>> ListAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงรายการรอคืนอุปกรณ์");

        var rows = await db.BorrowRequests
            .Include(b => b.Equipment)
            .Include(b => b.Borrower)
            .Where(b => b.Status == "approved")
            .OrderBy(b => b.BorrowDate)
            .Select(b => new
            {
                b.Id,
                b.RequestCode,
                b.BorrowerId,
                Borrower = b.Borrower != null ? b.Borrower.FullName : string.Empty,
                EquipmentName = b.Equipment != null ? b.Equipment.Name : string.Empty,
                b.BorrowDate,
                b.ExpectedReturn,
                b.Status,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการรอคืนสำเร็จ Count={Count}", rows.Count);
        return rows;
    }

    public async Task<object> ProcessAsync(Guid adminId, ProcessReturnDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มบันทึกคืนอุปกรณ์ BorrowId={BorrowId} Reason={Reason} AdminId={AdminId}", dto.BorrowId, dto.ReturnReason, adminId);

        var borrow = await db.BorrowRequests
            .Include(b => b.Equipment)
            .FirstOrDefaultAsync(b => b.Id == dto.BorrowId, cancellationToken);

        if (borrow is null)
        {
            logger.LogWarning("บันทึกคืนไม่สำเร็จ ไม่พบคำขอยืม BorrowId={BorrowId}", dto.BorrowId);
            throw new DomainException("ไม่พบคำขอยืม", 404);
        }

        if (borrow.Status != "approved")
        {
            logger.LogWarning("บันทึกคืนไม่สำเร็จ สถานะไม่ถูกต้อง BorrowId={BorrowId} Status={Status}", dto.BorrowId, borrow.Status);
            throw new DomainException("คำขอไม่ได้อยู่ในสถานะที่คืนได้");
        }

        var normalizedReason = dto.ReturnReason.Trim().ToLowerInvariant();
        var allowReasons = new[] { "normal", "resigned", "broken", "other" };
        if (!allowReasons.Contains(normalizedReason))
        {
            logger.LogWarning("บันทึกคืนไม่สำเร็จ เหตุผลไม่ถูกต้อง BorrowId={BorrowId} Reason={Reason}", dto.BorrowId, dto.ReturnReason);
            throw new DomainException("เหตุผลการคืนไม่ถูกต้อง");
        }

        var returnRecord = new ReturnRecord
        {
            BorrowId = dto.BorrowId,
            ReturnedBy = adminId,
            ApprovedBy = adminId,
            ReturnDate = dto.ReturnDate,
            ReturnReason = normalizedReason,
            ConditionNote = dto.ConditionNote,
            CreatedAt = DateTime.UtcNow,
        };

        if (borrow.Equipment is not null && normalizedReason != "broken")
        {
            borrow.Equipment.AvailableQty += 1;
            borrow.Equipment.Status = "available";
        }

        borrow.Status = "returned";
        borrow.UpdatedAt = DateTime.UtcNow;

        db.ReturnRecords.Add(returnRecord);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("บันทึกคืนสำเร็จ BorrowId={BorrowId} ReturnId={ReturnId}", dto.BorrowId, returnRecord.Id);
        return new { returnRecord.Id, borrow.Status };
    }

    public async Task<IReadOnlyList<object>> GetOutstandingByEmployeeAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงรายการค้างคืนของพนักงาน EmployeeId={EmployeeId}", employeeId);

        var rows = await db.BorrowRequests
            .Include(b => b.Equipment)
            .Include(b => b.Borrower)
            .Where(b => b.BorrowerId == employeeId && b.Status == "approved")
            .OrderBy(b => b.BorrowDate)
            .Select(b => new
            {
                b.Id,
                b.RequestCode,
                b.BorrowerId,
                Borrower = b.Borrower != null ? b.Borrower.FullName : string.Empty,
                EquipmentName = b.Equipment != null ? b.Equipment.Name : string.Empty,
                b.BorrowDate,
                b.ExpectedReturn,
                b.Status,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการค้างคืนสำเร็จ EmployeeId={EmployeeId} Count={Count}", employeeId, rows.Count);
        return rows;
    }

    public async Task<object> ProcessResignedByEmployeeAsync(
        Guid adminId,
        Guid employeeId,
        ProcessResignedReturnDto dto,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มคืนอุปกรณ์แบบลาออก EmployeeId={EmployeeId} AdminId={AdminId}", employeeId, adminId);

        var borrows = await db.BorrowRequests
            .Include(b => b.Equipment)
            .Where(b => b.BorrowerId == employeeId && b.Status == "approved")
            .ToListAsync(cancellationToken);

        if (borrows.Count == 0)
        {
            logger.LogWarning("คืนแบบลาออกไม่สำเร็จ ไม่พบรายการค้าง EmployeeId={EmployeeId}", employeeId);
            throw new DomainException("ไม่พบรายการยืมค้างของพนักงาน", 404);
        }

        var created = 0;

        foreach (var borrow in borrows)
        {
            var returnRecord = new ReturnRecord
            {
                BorrowId = borrow.Id,
                ReturnedBy = adminId,
                ApprovedBy = adminId,
                ReturnDate = dto.ReturnDate,
                ReturnReason = "resigned",
                ConditionNote = dto.ConditionNote,
                CreatedAt = DateTime.UtcNow,
            };

            if (borrow.Equipment is not null)
            {
                borrow.Equipment.AvailableQty += 1;
                borrow.Equipment.Status = "available";
            }

            borrow.Status = "returned";
            borrow.UpdatedAt = DateTime.UtcNow;

            db.ReturnRecords.Add(returnRecord);
            created++;
        }

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("คืนแบบลาออกสำเร็จ EmployeeId={EmployeeId} Count={Count}", employeeId, created);

        return new
        {
            employeeId,
            processedCount = created,
            reason = "resigned",
        };
    }
}
