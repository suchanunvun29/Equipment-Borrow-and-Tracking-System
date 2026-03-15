using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.EquipmentCategory;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class EquipmentCategoryService(AppDbContext db, ILogger<EquipmentCategoryService> logger) : IEquipmentCategoryService
{
    public async Task<List<EquipmentCategoryDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงรายการประเภทอุปกรณ์ทั้งหมด");

        var data = await db.EquipmentCategories
            .OrderBy(c => c.Name)
            .Select(c => new EquipmentCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการประเภทอุปกรณ์สำเร็จ จำนวน={Count}", data.Count);
        return data;
    }

    public async Task<EquipmentCategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงข้อมูลประเภทอุปกรณ์ Id={CategoryId}", id);

        var category = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("ไม่พบข้อมูลประเภทอุปกรณ์ Id={CategoryId}", id);
            return null;
        }

        logger.LogInformation("ดึงข้อมูลประเภทอุปกรณ์สำเร็จ Id={CategoryId}", id);
        return MapToDto(category);
    }

    public async Task<EquipmentCategoryDto> CreateAsync(CreateEquipmentCategoryDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มสร้างประเภทอุปกรณ์ Name={CategoryName}", dto.Name);
        ValidateCreateOrUpdate(dto);

        var name = dto.Name.Trim();
        var exists = await db.EquipmentCategories.AnyAsync(c => c.Name == name, cancellationToken);
        if (exists)
        {
            logger.LogWarning("สร้างประเภทอุปกรณ์ไม่สำเร็จ เพราะชื่อซ้ำ Name={CategoryName}", name);
            throw new DomainException("ชื่อประเภทอุปกรณ์ซ้ำ", 409);
        }

        var category = new EquipmentCategory
        {
            Name = name,
            Description = dto.Description?.Trim(),
        };

        db.EquipmentCategories.Add(category);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("สร้างประเภทอุปกรณ์สำเร็จ Id={CategoryId}", category.Id);
        return MapToDto(category);
    }

    public async Task<EquipmentCategoryDto> UpdateAsync(Guid id, UpdateEquipmentCategoryDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มแก้ไขประเภทอุปกรณ์ Id={CategoryId}", id);
        ValidateCreateOrUpdate(dto);

        var category = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("แก้ไขประเภทอุปกรณ์ไม่สำเร็จ ไม่พบข้อมูล Id={CategoryId}", id);
            throw new DomainException("ไม่พบข้อมูลประเภทอุปกรณ์", 404);
        }

        var name = dto.Name.Trim();
        var exists = await db.EquipmentCategories.AnyAsync(c => c.Name == name && c.Id != id, cancellationToken);
        if (exists)
        {
            logger.LogWarning("แก้ไขประเภทอุปกรณ์ไม่สำเร็จ เพราะชื่อซ้ำ Id={CategoryId} Name={CategoryName}", id, name);
            throw new DomainException("ชื่อประเภทอุปกรณ์ซ้ำ", 409);
        }

        category.Name = name;
        category.Description = dto.Description?.Trim();

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("แก้ไขประเภทอุปกรณ์สำเร็จ Id={CategoryId}", id);

        return MapToDto(category);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มลบประเภทอุปกรณ์ Id={CategoryId}", id);

        var category = await db.EquipmentCategories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
        {
            logger.LogWarning("ลบประเภทอุปกรณ์ไม่สำเร็จ ไม่พบข้อมูล Id={CategoryId}", id);
            return false;
        }

        var hasEquipment = await db.Equipment.AnyAsync(e => e.CategoryId == id, cancellationToken);
        if (hasEquipment)
        {
            logger.LogWarning("ลบประเภทอุปกรณ์ไม่สำเร็จ มีอุปกรณ์ผูกอยู่ Id={CategoryId}", id);
            throw new DomainException("ไม่สามารถลบประเภทอุปกรณ์ที่มีข้อมูลอุปกรณ์ผูกอยู่", 409);
        }

        db.EquipmentCategories.Remove(category);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("ลบประเภทอุปกรณ์สำเร็จ Id={CategoryId}", id);
        return true;
    }

    private static EquipmentCategoryDto MapToDto(EquipmentCategory category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
        CreatedAt = category.CreatedAt,
    };

    private static void ValidateCreateOrUpdate(BaseEquipmentCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new DomainException("กรุณาระบุชื่อประเภทอุปกรณ์");
        }
    }
}
