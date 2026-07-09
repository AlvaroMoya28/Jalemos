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

        // Step 1 of Google Sign-In: validates the id_token and either logs the user in
        // (existing account) or reports that a profile must be completed (new account).
        Task<GoogleSignInResultDto> GoogleSignInAsync(string idToken, CancellationToken ct = default);

        // Step 2: creates the account for a new Google user once they pick a username.
        // Throws InvalidOperationException if the username/email is already taken.
        Task<AuthResponseDto> GoogleCompleteAsync(GoogleCompleteRequestDto dto, CancellationToken ct = default);
    }
}
