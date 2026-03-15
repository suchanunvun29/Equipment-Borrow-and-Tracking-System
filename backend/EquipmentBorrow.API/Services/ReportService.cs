using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class ReportService(AppDbContext db, ILogger<ReportService> logger) : IReportService
{
    public async Task<object> SummaryAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มสรุปรายงานภาพรวม");

        var totalEquipment = await db.Equipment.CountAsync(cancellationToken);
        var currentBorrowed = await db.BorrowRequests.CountAsync(b => b.Status == "approved", cancellationToken);
        var pendingApproval = await db.BorrowRequests.CountAsync(b => b.Status == "pending", cancellationToken);

        var overdueCount = await db.BorrowRequests.CountAsync(
            b => b.Status == "approved" && b.ExpectedReturn != null && b.ExpectedReturn < DateOnly.FromDateTime(DateTime.UtcNow),
            cancellationToken);

        logger.LogInformation("สรุปรายงานสำเร็จ TotalEquipment={TotalEquipment} CurrentBorrowed={CurrentBorrowed}", totalEquipment, currentBorrowed);
        return new { totalEquipment, currentBorrowed, overdueCount, pendingApproval };
    }

    public async Task<IReadOnlyList<object>> ByPeriodAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มรายงานตามช่วงเวลา From={From} To={To}", from, to);

        if (from > to)
        {
            throw new DomainException("ช่วงวันที่ไม่ถูกต้อง");
        }

        var rows = await db.BorrowRequests
            .Include(b => b.Borrower)
            .Include(b => b.Equipment)
            .Where(b => b.BorrowDate >= from && b.BorrowDate <= to)
            .OrderByDescending(b => b.BorrowDate)
            .Select(b => new
            {
                b.Id,
                b.RequestCode,
                Borrower = b.Borrower != null ? b.Borrower.FullName : string.Empty,
                EquipmentName = b.Equipment != null ? b.Equipment.Name : string.Empty,
                b.BorrowDate,
                b.ExpectedReturn,
                b.Status,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("รายงานตามช่วงเวลาสำเร็จ Count={Count}", rows.Count);
        return rows;
    }

    public async Task<IReadOnlyList<object>> EquipmentAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มรายงานอุปกรณ์");

        var rows = await db.Equipment
            .OrderBy(e => e.Code)
            .Select(e => new
            {
                e.Id,
                e.Code,
                e.Name,
                e.TotalQuantity,
                e.AvailableQty,
                e.Status,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("รายงานอุปกรณ์สำเร็จ Count={Count}", rows.Count);
        return rows;
    }

    public async Task<IReadOnlyList<object>> OverdueAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มรายงานอุปกรณ์เกินกำหนด");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var rows = await db.BorrowRequests
            .Include(b => b.Borrower)
            .Include(b => b.Equipment)
            .Where(b => b.Status == "approved" && b.ExpectedReturn != null && b.ExpectedReturn < today)
            .OrderBy(b => b.ExpectedReturn)
            .Select(b => new
            {
                b.Id,
                b.RequestCode,
                Borrower = b.Borrower != null ? b.Borrower.FullName : string.Empty,
                EquipmentName = b.Equipment != null ? b.Equipment.Name : string.Empty,
                b.BorrowDate,
                b.ExpectedReturn,
                b.Status,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("รายงานเกินกำหนดสำเร็จ Count={Count}", rows.Count);
        return rows;
    }
}
