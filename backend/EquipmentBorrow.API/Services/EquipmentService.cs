using EquipmentBorrow.API.Common;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Equipment;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipmentBorrow.API.Services;

public class EquipmentService(AppDbContext db, ILogger<EquipmentService> logger) : IEquipmentService
{
    public async Task<List<EquipmentDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงรายการอุปกรณ์ทั้งหมด");

        var data = await db.Equipment
            .OrderBy(e => e.Code)
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Code = e.Code,
                Name = e.Name,
                Model = e.Model,
                CategoryId = e.CategoryId,
                CategoryName = e.Category != null ? e.Category.Name : null,
                TotalQuantity = e.TotalQuantity,
                AvailableQty = e.AvailableQty,
                Status = e.Status,
                Description = e.Description,
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("ดึงรายการอุปกรณ์สำเร็จ จำนวน={Count}", data.Count);
        return data;
    }

    public async Task<EquipmentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มดึงข้อมูลอุปกรณ์ Id={EquipmentId}", id);

        var equipment = await db.Equipment
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (equipment is null)
        {
            logger.LogWarning("ไม่พบข้อมูลอุปกรณ์ Id={EquipmentId}", id);
            return null;
        }

        logger.LogInformation("ดึงข้อมูลอุปกรณ์สำเร็จ Id={EquipmentId}", id);
        return MapToDto(equipment);
    }

    public async Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มสร้างอุปกรณ์ใหม่ Code={Code}", dto.Code);

        await ValidateCreateOrUpdate(dto, cancellationToken);

        var existsCode = await db.Equipment.AnyAsync(e => e.Code == dto.Code.Trim(), cancellationToken);
        if (existsCode)
        {
            logger.LogWarning("สร้างอุปกรณ์ไม่สำเร็จ เพราะรหัสซ้ำ Code={Code}", dto.Code);
            throw new DomainException("รหัสอุปกรณ์ซ้ำ", 409);
        }

        var equipment = new Equipment
        {
            Code = dto.Code.Trim(),
            Name = dto.Name.Trim(),
            Model = dto.Model?.Trim(),
            CategoryId = dto.CategoryId,
            TotalQuantity = dto.TotalQuantity,
            AvailableQty = dto.AvailableQty,
            Status = dto.AvailableQty > 0 ? "available" : "out_of_stock",
            Description = dto.Description?.Trim(),
            UpdatedAt = DateTime.UtcNow,
        };

        db.Equipment.Add(equipment);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("สร้างอุปกรณ์สำเร็จ Id={EquipmentId} Code={Code}", equipment.Id, equipment.Code);
        return MapToDto(equipment);
    }

    public async Task<EquipmentDto> UpdateAsync(Guid id, UpdateEquipmentDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มแก้ไขอุปกรณ์ Id={EquipmentId}", id);

        var equipment = await db.Equipment.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (equipment is null)
        {
            logger.LogWarning("แก้ไขอุปกรณ์ไม่สำเร็จ ไม่พบข้อมูล Id={EquipmentId}", id);
            throw new DomainException("ไม่พบข้อมูลอุปกรณ์", 404);
        }

        await ValidateCreateOrUpdate(dto, cancellationToken);

        var existsCode = await db.Equipment.AnyAsync(e => e.Code == dto.Code.Trim() && e.Id != id, cancellationToken);
        if (existsCode)
        {
            logger.LogWarning("แก้ไขอุปกรณ์ไม่สำเร็จ เพราะรหัสซ้ำ Id={EquipmentId} Code={Code}", id, dto.Code);
            throw new DomainException("รหัสอุปกรณ์ซ้ำ", 409);
        }

        equipment.Code = dto.Code.Trim();
        equipment.Name = dto.Name.Trim();
        equipment.Model = dto.Model?.Trim();
        equipment.CategoryId = dto.CategoryId;
        equipment.TotalQuantity = dto.TotalQuantity;
        equipment.AvailableQty = dto.AvailableQty;
        equipment.Status = dto.AvailableQty > 0 ? "available" : "out_of_stock";
        equipment.Description = dto.Description?.Trim();
        equipment.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("แก้ไขอุปกรณ์สำเร็จ Id={EquipmentId}", id);
        return MapToDto(equipment);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มลบอุปกรณ์ Id={EquipmentId}", id);

        var equipment = await db.Equipment.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (equipment is null)
        {
            logger.LogWarning("ลบอุปกรณ์ไม่สำเร็จ ไม่พบข้อมูล Id={EquipmentId}", id);
            return false;
        }

        db.Equipment.Remove(equipment);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("ลบอุปกรณ์สำเร็จ Id={EquipmentId}", id);
        return true;
    }

    private static EquipmentDto MapToDto(Equipment e) => new()
    {
        Id = e.Id,
        Code = e.Code,
        Name = e.Name,
        Model = e.Model,
        CategoryId = e.CategoryId,
        CategoryName = e.Category?.Name,
        TotalQuantity = e.TotalQuantity,
        AvailableQty = e.AvailableQty,
        Status = e.Status,
        Description = e.Description,
    };

    private async Task ValidateCreateOrUpdate(BaseEquipmentDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            throw new DomainException("กรุณาระบุรหัสอุปกรณ์");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new DomainException("กรุณาระบุชื่ออุปกรณ์");
        }

        if (!dto.CategoryId.HasValue || dto.CategoryId.Value == Guid.Empty)
        {
            throw new DomainException("กรุณาเลือกประเภทอุปกรณ์");
        }

        var categoryExists = await db.EquipmentCategories.AnyAsync(c => c.Id == dto.CategoryId.Value, cancellationToken);
        if (!categoryExists)
        {
            throw new DomainException("ไม่พบประเภทอุปกรณ์ที่เลือก", 404);
        }

        if (dto.TotalQuantity < 1)
        {
            throw new DomainException("จำนวนทั้งหมดต้องมากกว่าหรือเท่ากับ 1");
        }

        if (dto.AvailableQty < 0)
        {
            throw new DomainException("จำนวนคงเหลือต้องไม่ติดลบ");
        }

        if (dto.AvailableQty > dto.TotalQuantity)
        {
            throw new DomainException("จำนวนคงเหลือต้องไม่มากกว่าจำนวนทั้งหมด");
        }
    }
}
