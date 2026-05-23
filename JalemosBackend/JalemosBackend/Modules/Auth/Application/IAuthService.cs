using JalemosBackend.Modules.Auth.Application.DTOs;

namespace JalemosBackend.Modules.Auth.Application
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(string identifier, string password, CancellationToken ct = default);
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default);
    }
}
