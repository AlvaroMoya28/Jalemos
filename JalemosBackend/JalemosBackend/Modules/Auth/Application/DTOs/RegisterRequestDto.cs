namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    public record RegisterRequestDto(
        string Username,
        string Email,
        string FirstName,
        string LastName,
        string Password
    );
}
