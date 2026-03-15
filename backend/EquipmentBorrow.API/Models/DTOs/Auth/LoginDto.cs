using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Auth;

public class LoginDto
{
    [Required(ErrorMessage = "กรุณาระบุชื่อผู้ใช้")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "กรุณาระบุรหัสผ่าน")]
    public string Password { get; set; } = string.Empty;
}
