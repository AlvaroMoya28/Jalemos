namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    public record VerifyEmailRequestDto(Guid UserId, string Code);
}
