namespace JalemosBackend.Modules.Ratings.Domain;

public sealed class Rating
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public Guid RaterId { get; set; }
    public Guid RatedId { get; set; }
    public short Score { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
