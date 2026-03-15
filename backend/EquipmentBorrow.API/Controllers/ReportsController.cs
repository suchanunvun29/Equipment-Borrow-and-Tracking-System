using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken cancellationToken)
    {
        var result = await reportService.SummaryAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("period")]
    public async Task<IActionResult> ByPeriod([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken cancellationToken)
    {
        try
        {
            var rows = await reportService.ByPeriodAsync(from, to, cancellationToken);
            return Ok(rows);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpGet("equipment")]
    public async Task<IActionResult> EquipmentReport(CancellationToken cancellationToken)
    {
        var rows = await reportService.EquipmentAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("overdue")]
    public async Task<IActionResult> Overdue(CancellationToken cancellationToken)
    {
        var rows = await reportService.OverdueAsync(cancellationToken);
        return Ok(rows);
    }
}
