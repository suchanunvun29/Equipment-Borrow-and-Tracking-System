namespace EquipmentBorrow.API.Models.Entities;

public class ReturnRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BorrowId { get; set; }
    public BorrowRequest? BorrowRequest { get; set; }
    public Guid? ReturnedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateOnly ReturnDate { get; set; }
    public string ReturnReason { get; set; } = "normal";
    public string? ConditionNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
