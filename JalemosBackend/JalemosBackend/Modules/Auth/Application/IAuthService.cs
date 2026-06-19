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
        // Re-sends a fresh verification code; returns the new expiry. Throws ResendCooldownException
        // if requested again before the cooldown elapses.
        Task<DateTime> ResendVerificationAsync(ResendVerificationRequestDto dto, CancellationToken ct = default);
        Task<AuthResponseDto?> RefreshAsync(Guid userId, CancellationToken ct = default);
    }
}
