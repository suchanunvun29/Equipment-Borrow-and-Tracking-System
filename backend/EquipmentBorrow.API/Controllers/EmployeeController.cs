using EquipmentBorrow.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class EmployeeController(AppDbContext db, ILogger<EmployeeController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        logger.LogInformation("เริ่มดึงรายการพนักงาน");

        var rows = await db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FullName,
                u.EmployeeCode,
                u.Department,
                u.Role,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการพนักงานสำเร็จ Count={Count}", rows.Count);
        return Ok(rows);
    }
}
