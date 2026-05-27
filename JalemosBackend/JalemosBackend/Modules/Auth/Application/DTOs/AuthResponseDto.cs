namespace JalemosBackend.Modules.Auth.Application.DTOs
{
    // Returned by both login and register. Token is a signed JWT valid for 30 days.
    // Role is one of: "admin", "passenger", "passenger+driver".
    public record AuthResponseDto(
        string  Token,
        string  Id,
        string  Username,
        string  Email,
        string  FirstName,
        string  LastName,
        string  Role,
        string  Avatar,
        string? ProfilePhotoUrl,
        bool    ProfilePhotoLocked,
        decimal Rating,
        int     TripsCount,
        int     DriverTripsCount,
        string  MemberSince,
        short?  LicenseExpiryMonth,
        short?  LicenseExpiryYear,
        short?  DekraExpiryMonth,
        short?  DekraExpiryYear
    );
}
