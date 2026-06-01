namespace JalemosBackend.Modules.Users.Application.DTOs;

public sealed class UserSummaryDto
{
    public Guid   Id             { get; set; }
    public string Username       { get; set; } = string.Empty;
    public string Email          { get; set; } = string.Empty;
    public string FirstName      { get; set; } = string.Empty;
    public string LastName       { get; set; } = string.Empty;
    public string Role           { get; set; } = string.Empty;
    public decimal MeanRating    { get; set; }
    public int    TotalTrips     { get; set; }
    public decimal Kms           { get; set; }
    public bool   IsActive       { get; set; }
    public DateTime? SuspendedUntil { get; set; }
    public DateTime  CreatedAt   { get; set; }
    public string? ProfilePhotoUrl { get; set; }
}
