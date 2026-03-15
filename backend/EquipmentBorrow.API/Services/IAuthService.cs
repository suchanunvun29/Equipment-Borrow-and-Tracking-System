using EquipmentBorrow.API.Models.DTOs.Auth;

namespace EquipmentBorrow.API.Services;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default);
    Task<LoginResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);
}
