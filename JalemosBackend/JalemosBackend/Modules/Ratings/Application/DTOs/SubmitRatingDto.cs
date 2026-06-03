namespace JalemosBackend.Modules.Ratings.Application.DTOs;

public sealed class SubmitRatingDto
{
    public Guid TripId { get; set; }
    public Guid RatedId { get; set; }
    /// <summary>Star rating 1–5.</summary>
    public short Score { get; set; }
    public string? Comment { get; set; }
}
