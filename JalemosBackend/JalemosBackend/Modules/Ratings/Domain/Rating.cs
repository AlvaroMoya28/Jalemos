// Domain entity for the Ratings module.
// Captures a star rating and optional comment left by one user about another after a trip.

namespace JalemosBackend.Modules.Ratings.Domain;

/// <summary>
/// Represents a post-trip rating submitted by a passenger or driver.
/// </summary>
public sealed class Rating
{
    // TODO: Add RaterId, RatedUserId, TripId, Score (1-5), Comment,
    //       SubmittedAt, and validation that Score is within the 1-5 range.
    public Guid Id { get; set; }
}
