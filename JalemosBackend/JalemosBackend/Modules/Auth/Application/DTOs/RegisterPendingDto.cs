namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    public record RegisterPendingDto(Guid UserId, string Email, DateTime ExpiresAt);
}
