using System.Security.Claims;
using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Models.DTOs.Borrow;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "StaffAndAdmin")]
public class BorrowController(IBorrowService borrowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "staff";
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(userIdClaim, out var uid) ? uid : null;

        var rows = await borrowService.ListAsync(role, userId, cancellationToken);
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBorrowDto dto, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "ไม่พบข้อมูลผู้ใช้งาน" });
        }

        try
        {
            var result = await borrowService.CreateAsync(userId, dto, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(new { message = "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        try
        {
            var result = await borrowService.ApproveAsync(id, adminId, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectBorrowDto dto, CancellationToken cancellationToken)
    {
        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized(new { message = "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        try
        {
            var result = await borrowService.RejectAsync(id, adminId, dto.Note, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }
}
