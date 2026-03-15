namespace EquipmentBorrow.API.Models.Entities;

public class BorrowRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? RequestCode { get; set; }
    public Guid BorrowerId { get; set; }
    public User? Borrower { get; set; }
    public Guid EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public DateOnly BorrowDate { get; set; }
    public DateOnly? ExpectedReturn { get; set; }
    public string Status { get; set; } = "pending";
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ReturnRecord? ReturnRecord { get; set; }
}
