using EquipmentBorrow.API.Models.DTOs.EquipmentCategory;

namespace EquipmentBorrow.API.Services;

public interface IEquipmentCategoryService
{
    Task<List<EquipmentCategoryDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<EquipmentCategoryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EquipmentCategoryDto> CreateAsync(CreateEquipmentCategoryDto dto, CancellationToken cancellationToken = default);
    Task<EquipmentCategoryDto> UpdateAsync(Guid id, UpdateEquipmentCategoryDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
