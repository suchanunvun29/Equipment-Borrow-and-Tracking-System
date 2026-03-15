using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class SystemUsageLogController(ISystemUsageLogService systemUsageLogService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 200, CancellationToken cancellationToken = default)
    {
        var rows = await systemUsageLogService.ListAsync(limit, cancellationToken);
        return Ok(rows);
    }
}
