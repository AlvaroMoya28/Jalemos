// Application service for the Trips module.
// Orchestrates business rules (e.g., seat validation, driver ownership checks)
// and delegates all persistence operations to TripsRepository.

using JalemosBackend.Modules.Trips.Application.DTOs;
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

    // Minimum lead time before departure. The boarding window opens 5 min before
    // departure, so a trip set for "now" (or the past) can never be started — it
    // must be at least this far ahead. A 1-minute slack absorbs clock skew/latency
    // between the phone and the server.
    public static readonly TimeSpan MinLeadTime = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan LeadTimeSlack = TimeSpan.FromMinutes(1);

    /// <summary>
    /// True if <paramref name="departureAt"/> is far enough ahead of <paramref name="nowUtc"/>
    /// to allow boarding (min lead time minus a small slack). Normalises the departure to UTC.
    /// </summary>
    public static bool DepartureMeetsMinimumLeadTime(DateTime departureAt, DateTime nowUtc)
    {
        var departureUtc = departureAt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(departureAt, DateTimeKind.Utc)
            : departureAt.ToUniversalTime();
        return departureUtc >= nowUtc.Add(MinLeadTime - LeadTimeSlack);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        if (!DepartureMeetsMinimumLeadTime(trip.DepartureAt, DateTime.UtcNow))
            throw new InvalidOperationException("La hora de salida debe ser al menos 5 minutos en el futuro.");

        // TODO: validate that the driver has a registered vehicle
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

    /// <inheritdoc/>
    public Task<IEnumerable<TripDto>> GetByDriverAsync(Guid driverId, CancellationToken cancellationToken = default)
        => _repository.GetByDriverAsync(driverId, cancellationToken);
}
