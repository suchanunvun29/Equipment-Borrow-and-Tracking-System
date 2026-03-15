using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.EquipmentCategory;

public class BaseEquipmentCategoryDto
{
    [Required(ErrorMessage = "กรุณาระบุชื่อประเภทอุปกรณ์")]
    [StringLength(100, ErrorMessage = "ชื่อประเภทอุปกรณ์ต้องไม่เกิน 100 ตัวอักษร")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "รายละเอียดต้องไม่เกิน 500 ตัวอักษร")]
    public string? Description { get; set; }
}
