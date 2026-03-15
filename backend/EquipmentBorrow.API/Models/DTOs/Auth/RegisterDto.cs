using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "กรุณาระบุชื่อผู้ใช้")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "ชื่อผู้ใช้ต้องมีความยาว 3-100 ตัวอักษร")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "กรุณาระบุรหัสผ่าน")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "กรุณาระบุชื่อ-นามสกุล")]
    [StringLength(200, ErrorMessage = "ชื่อ-นามสกุลยาวเกินกำหนด")]
    public string FullName { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "รหัสพนักงานยาวเกินกำหนด")]
    public string? EmployeeCode { get; set; }

    [StringLength(100, ErrorMessage = "ชื่อแผนกยาวเกินกำหนด")]
    public string? Department { get; set; }
}
