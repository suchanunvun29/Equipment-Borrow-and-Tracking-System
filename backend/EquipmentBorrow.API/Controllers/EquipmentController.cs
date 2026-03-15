using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Models.DTOs.Equipment;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "StaffAndAdmin")]
public class EquipmentController(IEquipmentService equipmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var data = await equipmentService.ListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var equipment = await equipmentService.GetByIdAsync(id, cancellationToken);
        if (equipment is null)
        {
            return NotFound(new { message = "ไม่พบข้อมูลอุปกรณ์" });
        }

        return Ok(equipment);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateEquipmentDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await equipmentService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEquipmentDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await equipmentService.UpdateAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await equipmentService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "ไม่พบข้อมูลอุปกรณ์" });
        }

        return NoContent();
    }
}
