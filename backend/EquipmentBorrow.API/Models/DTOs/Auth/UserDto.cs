namespace EquipmentBorrow.API.Models.DTOs.Auth;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeCode { get; set; }
    public string? Department { get; set; }
    public string Role { get; set; } = "staff";
}
