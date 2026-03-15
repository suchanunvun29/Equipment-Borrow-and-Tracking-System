using System.Security.Claims;
using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Models.DTOs.Return;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class ReturnController(IReturnService returnService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var rows = await returnService.ListAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("outstanding/{employeeId:guid}")]
    public async Task<IActionResult> OutstandingByEmployee(Guid employeeId, CancellationToken cancellationToken)
    {
        var rows = await returnService.GetOutstandingByEmployeeAsync(employeeId, cancellationToken);
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Process([FromBody] ProcessReturnDto dto, CancellationToken cancellationToken)
    {
        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(new { message = "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        try
        {
            var result = await returnService.ProcessAsync(adminId, dto, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPost("resigned/{employeeId:guid}")]
    public async Task<IActionResult> ProcessResigned(Guid employeeId, [FromBody] ProcessResignedReturnDto dto, CancellationToken cancellationToken)
    {
        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(new { message = "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        try
        {
            var result = await returnService.ProcessResignedByEmployeeAsync(adminId, employeeId, dto, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }
}
