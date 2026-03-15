using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Equipment;

public class BaseEquipmentDto
{
    [Required(ErrorMessage = "กรุณาระบุรหัสอุปกรณ์")]
    [StringLength(50, ErrorMessage = "รหัสอุปกรณ์ยาวเกินกำหนด")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "กรุณาระบุชื่ออุปกรณ์")]
    [StringLength(200, ErrorMessage = "ชื่ออุปกรณ์ยาวเกินกำหนด")]
    public string Name { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "รุ่นอุปกรณ์ยาวเกินกำหนด")]
    public string? Model { get; set; }

    [Required(ErrorMessage = "กรุณาเลือกประเภทอุปกรณ์")]
    public Guid? CategoryId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "จำนวนทั้งหมดต้องมากกว่าหรือเท่ากับ 1")]
    public int TotalQuantity { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "จำนวนคงเหลือต้องไม่ติดลบ")]
    public int AvailableQty { get; set; }

    [StringLength(1000, ErrorMessage = "รายละเอียดอุปกรณ์ยาวเกินกำหนด")]
    public string? Description { get; set; }
}
