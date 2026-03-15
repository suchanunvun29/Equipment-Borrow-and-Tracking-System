using EquipmentBorrow.API.Models.DTOs.Auth;
using EquipmentBorrow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentBorrow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(dto, cancellationToken);
        if (result is null)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        return Ok(result);
    }
}
