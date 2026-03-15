using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Models.DTOs.EquipmentCategory;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "StaffAndAdmin")]
public class EquipmentCategoryController(IEquipmentCategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var data = await categoryService.ListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var category = await categoryService.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return NotFound(new { message = "ไม่พบข้อมูลประเภทอุปกรณ์" });
        }

        return Ok(category);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateEquipmentCategoryDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await categoryService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEquipmentCategoryDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await categoryService.UpdateAsync(id, dto, cancellationToken);
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
        try
        {
            var deleted = await categoryService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(new { message = "ไม่พบข้อมูลประเภทอุปกรณ์" });
            }

            return NoContent();
        }
        catch (DomainException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
    }
}
