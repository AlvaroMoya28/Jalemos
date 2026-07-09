using System.ComponentModel.DataAnnotations;

namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    // First step of Google Sign-In: the app sends the id_token Google returned.
    public sealed class GoogleSignInRequestDto
    {
        [Required]
        public string IdToken { get; set; } = "";
    }

    // Second step: when the Google account is new, the app collects a username and
    // (optionally) lets the user tweak the name pulled from Google, then completes signup.
    public sealed class GoogleCompleteRequestDto
    {
        [Required]
        public string IdToken { get; set; } = "";

        [Required, MinLength(3), MaxLength(50)]
        public string Username { get; set; } = "";

        // Optional overrides — default to the values Google provided if omitted.
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
