namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    // Result of POST /api/auth/google.
    // - Existing account  → NeedsProfile = false and Session carries the JWT (user is logged in).
    // - New Google account → NeedsProfile = true and Prefill holds the data pulled from Google
    //   (the app then shows a "complete your profile" screen to pick a username).
    public sealed record GoogleSignInResultDto(
        bool NeedsProfile,
        AuthResponseDto? Session,
        GoogleProfilePrefillDto? Prefill
    );

    // Values taken from the Google account to pre-fill the profile-completion screen.
    public sealed record GoogleProfilePrefillDto(
        string Email,
        string FirstName,
        string LastName,
        string SuggestedUsername,
        string? PhotoUrl
    );
}
