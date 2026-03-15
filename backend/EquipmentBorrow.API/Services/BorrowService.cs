using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Borrow;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class BorrowService(AppDbContext db, ILogger<BorrowService> logger) : IBorrowService
{
    public async Task<IReadOnlyList<object>> ListAsync(string role, Guid? userId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงรายการยืม Role={Role} UserId={UserId}", role, userId);

        IQueryable<BorrowRequest> query = db.BorrowRequests
            .Include(b => b.Equipment)
            .Include(b => b.Borrower)
            .Include(b => b.ReturnRecord)
            .OrderByDescending(b => b.CreatedAt);

        if (role != "admin" && userId.HasValue)
        {
            query = query.Where(b => b.BorrowerId == userId.Value).OrderByDescending(b => b.CreatedAt);
        }

        var rows = await query.Select(b => new
        {
            b.Id,
            b.RequestCode,
            Borrower = b.Borrower != null ? b.Borrower.FullName : string.Empty,
            EquipmentName = b.Equipment != null ? b.Equipment.Name : string.Empty,
            b.BorrowDate,
            b.ExpectedReturn,
            b.Status,
            b.Notes,
            b.ApprovedAt,
            ReturnDate = b.ReturnRecord != null ? b.ReturnRecord.ReturnDate : (DateOnly?)null,
            ReturnReason = b.ReturnRecord != null ? b.ReturnRecord.ReturnReason : null,
            ConditionNote = b.ReturnRecord != null ? b.ReturnRecord.ConditionNote : null,
        }).ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการยืมสำเร็จ Count={Count}", rows.Count);
        return rows;
    }

    public async Task<object> CreateAsync(Guid userId, CreateBorrowDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มสร้างคำขอยืม UserId={UserId} EquipmentId={EquipmentId}", userId, dto.EquipmentId);

        var equipment = await db.Equipment.FirstOrDefaultAsync(e => e.Id == dto.EquipmentId, cancellationToken);
        if (equipment is null)
        {
            logger.LogWarning("สร้างคำขอยืมไม่สำเร็จ ไม่พบอุปกรณ์ EquipmentId={EquipmentId}", dto.EquipmentId);
            throw new DomainException("ไม่พบข้อมูลอุปกรณ์", 404);
        }

        if (equipment.AvailableQty <= 0)
        {
            logger.LogWarning("สร้างคำขอยืมไม่สำเร็จ อุปกรณ์ไม่พร้อมใช้งาน EquipmentId={EquipmentId}", dto.EquipmentId);
            throw new DomainException("ไม่มีอุปกรณ์ว่าง");
        }

        var borrow = new BorrowRequest
        {
            BorrowerId = userId,
            EquipmentId = dto.EquipmentId,
            BorrowDate = dto.BorrowDate,
            ExpectedReturn = dto.ExpectedReturn,
            Notes = dto.Notes,
            Status = "pending",
            RequestCode = $"BR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
        };

        db.BorrowRequests.Add(borrow);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("สร้างคำขอยืมสำเร็จ BorrowId={BorrowId} Code={Code}", borrow.Id, borrow.RequestCode);
        return new { borrow.Id, borrow.RequestCode, borrow.Status };
    }

    public async Task<object> ApproveAsync(Guid id, Guid adminId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มอนุมัติคำขอยืม BorrowId={BorrowId} AdminId={AdminId}", id, adminId);

        var borrow = await db.BorrowRequests
            .Include(b => b.Equipment)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (borrow is null)
        {
            logger.LogWarning("อนุมัติไม่สำเร็จ ไม่พบคำขอยืม BorrowId={BorrowId}", id);
            throw new DomainException("ไม่พบคำขอยืม", 404);
        }

        if (borrow.Status != "pending")
        {
            logger.LogWarning("อนุมัติไม่สำเร็จ สถานะไม่ใช่ pending BorrowId={BorrowId} Status={Status}", id, borrow.Status);
            throw new DomainException("คำขอไม่อยู่ในสถานะรออนุมัติ");
        }

        if (borrow.Equipment is null || borrow.Equipment.AvailableQty <= 0)
        {
            logger.LogWarning("อนุมัติไม่สำเร็จ อุปกรณ์ไม่พร้อม BorrowId={BorrowId}", id);
            throw new DomainException("อุปกรณ์ไม่พร้อมใช้งาน");
        }

        borrow.Equipment.AvailableQty -= 1;
        borrow.Equipment.Status = borrow.Equipment.AvailableQty > 0 ? "available" : "out_of_stock";
        borrow.Status = "approved";
        borrow.ApprovedBy = adminId;
        borrow.ApprovedAt = DateTime.UtcNow;
        borrow.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("อนุมัติคำขอยืมสำเร็จ BorrowId={BorrowId}", id);
        return new { borrow.Id, borrow.Status };
    }

    public async Task<object> RejectAsync(Guid id, Guid adminId, string? note, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มปฏิเสธคำขอยืม BorrowId={BorrowId} AdminId={AdminId}", id, adminId);

        var borrow = await db.BorrowRequests.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (borrow is null)
        {
            logger.LogWarning("ปฏิเสธไม่สำเร็จ ไม่พบคำขอยืม BorrowId={BorrowId}", id);
            throw new DomainException("ไม่พบคำขอยืม", 404);
        }

        if (borrow.Status != "pending")
        {
            logger.LogWarning("ปฏิเสธไม่สำเร็จ สถานะไม่ใช่ pending BorrowId={BorrowId} Status={Status}", id, borrow.Status);
            throw new DomainException("คำขอไม่อยู่ในสถานะรออนุมัติ");
        }

        borrow.Status = "rejected";
        borrow.ApprovedBy = adminId;
        borrow.ApprovedAt = DateTime.UtcNow;
        borrow.Notes = string.IsNullOrWhiteSpace(note) ? borrow.Notes : note.Trim();
        borrow.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("ปฏิเสธคำขอยืมสำเร็จ BorrowId={BorrowId}", id);
        return new { borrow.Id, borrow.Status };
    }
}
