// Application contract for the Ratings module.
// Defines the use cases for submitting, retrieving, and managing post-trip ratings.

using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Application;

/// <summary>
/// Exposes rating use cases: listing, fetching, submitting, updating, and deleting ratings.
/// </summary>
public interface IRatingsService
{
    /// <summary>Returns all ratings stored in the system.</summary>
    Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns the rating with the given id, or null if not found.</summary>
    Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Submits a new rating after validating score range and that the trip was completed.</summary>
    Task CreateAsync(Rating rating, CancellationToken cancellationToken = default);

    /// <summary>Updates an existing rating record.</summary>
    Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default);

    /// <summary>Removes the specified rating.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
