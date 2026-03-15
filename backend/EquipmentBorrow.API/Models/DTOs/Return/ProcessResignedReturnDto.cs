using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Return;

public class ProcessResignedReturnDto
{
    [Required(ErrorMessage = "กรุณาระบุวันที่คืน")]
    public DateOnly ReturnDate { get; set; }

    [StringLength(1000, ErrorMessage = "หมายเหตุสภาพอุปกรณ์ยาวเกินกำหนด")]
    public string? ConditionNote { get; set; }
}
