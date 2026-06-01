// Application service for the Trips module.
// Orchestrates business rules (e.g., seat validation, driver ownership checks)
// and delegates all persistence operations to TripsRepository.

using JalemosBackend.Modules.Trips.Domain;
using JalemosBackend.Modules.Trips.Infrastructure;

namespace JalemosBackend.Modules.Trips.Application;

/// <summary>
/// Implements trip use cases. Acts as the single orchestration point
/// between the HTTP layer and the data access layer for trip operations.
/// </summary>
public sealed class TripsService : ITripsService
{
    private readonly TripsRepository _repository;

    /// <summary>Injects the trips data access repository.</summary>
    public TripsService(TripsRepository repository)
    {
        _repository = repository;
    }

    /// <inheritdoc/>
    public Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<IEnumerable<TripDto>> GetAllWithDriverAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllWithDriverAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        // TODO: validate that the driver has a registered vehicle and that departure is in the future
        return _repository.CreateAsync(trip, cancellationToken);
    }
        
    /// <inheritdoc/>
    public Task UpdateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        // TODO: ensure only the owning driver can update, and reject changes after booking cutoff
        return _repository.UpdateAsync(trip, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: cascade-cancel all active bookings before deleting the trip
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
