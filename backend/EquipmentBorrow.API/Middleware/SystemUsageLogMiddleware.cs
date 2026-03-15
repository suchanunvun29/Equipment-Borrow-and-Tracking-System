using System.Diagnostics;
using System.Security.Claims;
using EquipmentBorrow.API.Services;

namespace EquipmentBorrow.API.Middleware;

public class SystemUsageLogMiddleware(RequestDelegate next, ILogger<SystemUsageLogMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, ISystemUsageLogService usageLogService)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var shouldLog = path.StartsWith("/api", StringComparison.OrdinalIgnoreCase)
                        && !path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase);

        if (!shouldLog)
        {
            await next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();

            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = Guid.TryParse(userIdClaim, out var uid) ? uid : null;
            var username = context.User.FindFirstValue(ClaimTypes.Name) ?? "anonymous";
            var role = context.User.FindFirstValue(ClaimTypes.Role) ?? "guest";
            var method = context.Request.Method;
            var statusCode = context.Response.StatusCode;
            var detail = $"IP={context.Connection.RemoteIpAddress}";

            try
            {
                await usageLogService.WriteAsync(
                    userId,
                    username,
                    role,
                    method,
                    path,
                    statusCode,
                    sw.ElapsedMilliseconds,
                    detail,
                    context.RequestAborted);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "บันทึกประวัติการใช้งานระบบไม่สำเร็จ Path={Path}", path);
            }
        }
    }
}
