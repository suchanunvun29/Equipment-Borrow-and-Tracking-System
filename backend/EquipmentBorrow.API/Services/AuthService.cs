using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EquipmentBorrow.API.Data;
using EquipmentBorrow.API.Models.DTOs.Auth;
using EquipmentBorrow.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EquipmentBorrow.API.Services;

public class AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger) : IAuthService
{
    public async Task<UserDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มลงทะเบียนผู้ใช้ Username={Username}", dto.Username);

        var exists = await db.Users.AnyAsync(u => u.Username == dto.Username, cancellationToken);
        if (exists)
        {
            logger.LogWarning("ลงทะเบียนไม่สำเร็จ Username ซ้ำ Username={Username}", dto.Username);
            throw new InvalidOperationException("Username already exists");
        }

        var user = new User
        {
            Username = dto.Username.Trim(),
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            EmployeeCode = dto.EmployeeCode?.Trim(),
            Department = dto.Department?.Trim(),
            Role = "staff",
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("ลงทะเบียนผู้ใช้สำเร็จ UserId={UserId}", user.Id);

        return MapUser(user);
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("เริ่มเข้าสู่ระบบ Username={Username}", dto.Username);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username && u.IsActive, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
        {
            logger.LogWarning("เข้าสู่ระบบไม่สำเร็จ Username={Username}", dto.Username);
            return null;
        }

        var response = new LoginResponseDto
        {
            Token = GenerateJwt(user),
            User = MapUser(user),
        };

        logger.LogInformation("เข้าสู่ระบบสำเร็จ UserId={UserId} Role={Role}", user.Id, user.Role);
        return response;
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var expires = DateTime.UtcNow.AddHours(double.Parse(config["JwtSettings:ExpiryHours"] ?? "8"));

        var token = new JwtSecurityToken(
            issuer: config["JwtSettings:Issuer"],
            audience: config["JwtSettings:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapUser(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        FullName = user.FullName,
        EmployeeCode = user.EmployeeCode,
        Department = user.Department,
        Role = user.Role,
    };
}
