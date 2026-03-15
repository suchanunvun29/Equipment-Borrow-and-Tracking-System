using EquipmentBorrow.API.Models.DTOs.Borrow;

namespace EquipmentBorrow.API.Services;

public interface IBorrowService
{
    Task<IReadOnlyList<object>> ListAsync(string role, Guid? userId, CancellationToken cancellationToken = default);
    Task<object> CreateAsync(Guid userId, CreateBorrowDto dto, CancellationToken cancellationToken = default);
    Task<object> ApproveAsync(Guid id, Guid adminId, CancellationToken cancellationToken = default);
    Task<object> RejectAsync(Guid id, Guid adminId, string? note, CancellationToken cancellationToken = default);
}
