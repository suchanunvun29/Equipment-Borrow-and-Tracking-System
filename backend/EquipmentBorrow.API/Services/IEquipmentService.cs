using EquipmentBorrow.API.Models.DTOs.Equipment;

namespace EquipmentBorrow.API.Services;

public interface IEquipmentService
{
    Task<List<EquipmentDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<EquipmentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto, CancellationToken cancellationToken = default);
    Task<EquipmentDto> UpdateAsync(Guid id, UpdateEquipmentDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
