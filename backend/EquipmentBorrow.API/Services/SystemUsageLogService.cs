using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.SystemUsage;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class SystemUsageLogService(AppDbContext db, ILogger<SystemUsageLogService> logger) : ISystemUsageLogService
{
    public async Task WriteAsync(
        Guid? userId,
        string username,
        string role,
        string method,
        string path,
        int statusCode,
        long durationMs,
        string? detail,
        CancellationToken cancellationToken = default)
    {
        var log = new SystemUsageLog
        {
            UserId = userId,
            Username = string.IsNullOrWhiteSpace(username) ? "anonymous" : username,
            Role = string.IsNullOrWhiteSpace(role) ? "guest" : role,
            Method = method,
            Path = path,
            StatusCode = statusCode,
            DurationMs = durationMs,
            Detail = detail,
            CreatedAt = DateTime.UtcNow,
        };

        db.SystemUsageLogs.Add(log);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<SystemUsageLogDto>> ListAsync(int limit = 200, CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 1;
        if (limit > 1000) limit = 1000;

        logger.LogInformation("เริ่มดึงประวัติการใช้งานระบบ Limit={Limit}", limit);

        var rows = await db.SystemUsageLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .Select(l => new SystemUsageLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Role = l.Role,
                Method = l.Method,
                Path = l.Path,
                StatusCode = l.StatusCode,
                DurationMs = l.DurationMs,
                Detail = l.Detail,
                CreatedAt = l.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงประวัติการใช้งานระบบสำเร็จ Count={Count}", rows.Count);
        return rows;
    }
}
