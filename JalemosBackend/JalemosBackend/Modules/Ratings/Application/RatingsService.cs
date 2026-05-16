// Application service for the Ratings module.
// Validates business rules (score range, one-rating-per-trip) and delegates
// persistence to RatingsRepository. Also responsible for recalculating user averages.

using JalemosBackend.Modules.Ratings.Domain;
using JalemosBackend.Modules.Ratings.Infrastructure;

namespace JalemosBackend.Modules.Ratings.Application;

/// <summary>
/// Implements rating use cases defined in <see cref="IRatingsService"/>.
/// </summary>
public sealed class RatingsService : IRatingsService
{
    private readonly RatingsRepository _repository;

    /// <summary>Injects the ratings data access repository.</summary>
    public RatingsService(RatingsRepository repository)
    {
        _repository = repository;
    }

    /// <inheritdoc/>
    public Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        // TODO: validate score is between 1 and 5, and that the rater participated in the trip
        // TODO: after saving, trigger recalculation of the rated user's average score
        return _repository.CreateAsync(rating, cancellationToken);
    }

    /// <inheritdoc/>
    public Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        // TODO: only allow updates within a short time window after the rating was submitted
        return _repository.UpdateAsync(rating, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
