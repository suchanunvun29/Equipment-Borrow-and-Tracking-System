using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Borrow;

public class CreateBorrowDto
{
    [Required(ErrorMessage = "กรุณาระบุอุปกรณ์")]
    public Guid EquipmentId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุวันที่ยืม")]
    public DateOnly BorrowDate { get; set; }

    public DateOnly? ExpectedReturn { get; set; }

    [StringLength(1000, ErrorMessage = "หมายเหตุยาวเกินกำหนด")]
    public string? Notes { get; set; }
}
