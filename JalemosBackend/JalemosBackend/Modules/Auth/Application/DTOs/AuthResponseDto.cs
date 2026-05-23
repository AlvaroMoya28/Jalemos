namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    public record AuthResponseDto(
        string Token,
        string Id,
        string Username,
        string Email,
        string FirstName,
        string LastName,
        string Role,
        string Avatar,
        decimal Rating,
        int TripsCount,
        string MemberSince
    );
}
