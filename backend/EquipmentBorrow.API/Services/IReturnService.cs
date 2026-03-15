using EquipmentBorrow.API.Models.DTOs.Return;

namespace EquipmentBorrow.API.Services;

public interface IReturnService
{
    Task<IReadOnlyList<object>> ListAsync(CancellationToken cancellationToken = default);
    Task<object> ProcessAsync(Guid adminId, ProcessReturnDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<object>> GetOutstandingByEmployeeAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<object> ProcessResignedByEmployeeAsync(
        Guid adminId,
        Guid employeeId,
        ProcessResignedReturnDto dto,
        CancellationToken cancellationToken = default);
}
