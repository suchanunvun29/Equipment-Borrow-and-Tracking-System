namespace EquipmentBorrow.API.Models.DTOs.SystemUsage;

public class SystemUsageLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public long DurationMs { get; set; }
    public string? Detail { get; set; }
    public DateTime CreatedAt { get; set; }
}
