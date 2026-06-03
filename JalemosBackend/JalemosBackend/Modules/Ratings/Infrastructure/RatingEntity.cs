namespace JalemosBackend.Modules.Ratings.Infrastructure;

public class RatingEntity
{
    public Guid RatingId { get; set; }
    public Guid TripId { get; set; }
    public Guid RaterId { get; set; }
    public Guid RatedId { get; set; }
    public short Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
