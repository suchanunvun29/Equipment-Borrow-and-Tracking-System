namespace EquipmentBorrow.API.Models.Entities;

public class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public EquipmentCategory? Category { get; set; }
    public string? Model { get; set; }
    public int TotalQuantity { get; set; } = 1;
    public int AvailableQty { get; set; } = 1;
    public string Status { get; set; } = "available";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
