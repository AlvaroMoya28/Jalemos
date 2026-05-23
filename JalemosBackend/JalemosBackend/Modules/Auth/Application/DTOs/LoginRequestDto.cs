namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    // Identifier accepts either username or email.
    public record LoginRequestDto(string Identifier, string Password);
}
