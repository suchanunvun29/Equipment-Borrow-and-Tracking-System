using EquipmentBorrow.API.Models.DTOs.SystemUsage;

namespace EquipmentBorrow.API.Services;

public interface ISystemUsageLogService
{
    Task WriteAsync(
        Guid? userId,
        string username,
        string role,
        string method,
        string path,
        int statusCode,
        long durationMs,
        string? detail,
        CancellationToken cancellationToken = default);

    Task<List<SystemUsageLogDto>> ListAsync(int limit = 200, CancellationToken cancellationToken = default);
}
