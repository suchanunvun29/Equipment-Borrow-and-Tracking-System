namespace EquipmentBorrow.API.Services;

public interface IReportService
{
    Task<object> SummaryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<object>> ByPeriodAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<object>> EquipmentAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<object>> OverdueAsync(CancellationToken cancellationToken = default);
}
