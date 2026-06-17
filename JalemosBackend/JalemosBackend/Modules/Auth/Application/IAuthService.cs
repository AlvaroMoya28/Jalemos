using JalemosBackend.Modules.Auth.Application.DTOs;

namespace JalemosBackend.Modules.Auth.Application
{
    // Contract for authentication operations. LoginAsync returns null on bad credentials.
    // RegisterAsync throws InvalidOperationException on duplicate email or username.
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(string identifier, string password, CancellationToken ct = default);
        Task<RegisterPendingDto> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default);
        Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailRequestDto dto, CancellationToken ct = default);
        Task<AuthResponseDto?> RefreshAsync(Guid userId, CancellationToken ct = default);
    }
}
