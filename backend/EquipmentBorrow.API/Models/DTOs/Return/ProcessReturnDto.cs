using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Return;

public class ProcessReturnDto
{
    [Required(ErrorMessage = "กรุณาระบุรายการยืม")]
    public Guid BorrowId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุวันที่คืน")]
    public DateOnly ReturnDate { get; set; }

    [Required(ErrorMessage = "กรุณาระบุเหตุผลการคืน")]
    [StringLength(30, ErrorMessage = "เหตุผลการคืนยาวเกินกำหนด")]
    public string ReturnReason { get; set; } = "normal";

    [StringLength(1000, ErrorMessage = "หมายเหตุสภาพอุปกรณ์ยาวเกินกำหนด")]
    public string? ConditionNote { get; set; }
}
