namespace EquipmentBorrow.API.Models.DTOs.Equipment;

public class EquipmentDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int TotalQuantity { get; set; }
    public int AvailableQty { get; set; }
    public string Status { get; set; } = "available";
    public string? Description { get; set; }
}
