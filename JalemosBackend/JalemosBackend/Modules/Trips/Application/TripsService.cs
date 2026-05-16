// Application service for the Trips module.
// Orchestrates business rules (e.g., seat validation, driver ownership checks)
// and delegates all persistence operations to TripsRepository.

using JalemosBackend.Modules.Rides.Domain;
using JalemosBackend.Modules.Rides.Infrastructure;

namespace JalemosBackend.Modules.Rides.Application;

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
        // TODO: add filtering by origin, destination, date, and available seats
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: validate that the driver has a registered vehicle and that departure is in the future
        return _repository.CreateAsync(ride, cancellationToken);
    }

    /// <inheritdoc/>
    public Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: ensure only the owning driver can update, and reject changes after booking cutoff
        return _repository.UpdateAsync(ride, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: cascade-cancel all active bookings before deleting the trip
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
