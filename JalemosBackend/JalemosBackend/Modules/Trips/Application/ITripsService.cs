// Application contract for the Trips (Rides) module.
// Defines all use cases the controller can invoke; business rules are enforced by the implementation.

using JalemosBackend.Modules.Rides.Domain;

namespace JalemosBackend.Modules.Rides.Application;

/// <summary>
/// Exposes trip-management use cases: listing, fetching, creating, updating, and deleting trips.
/// </summary>
public interface ITripsService
{
    /// <summary>Returns all available trips.</summary>
    Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns the trip with the given id, or null if it does not exist.</summary>
    Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Publishes a new trip after validating route, seats, and schedule.</summary>
    Task CreateAsync(Trip ride, CancellationToken cancellationToken = default);

    /// <summary>Modifies an existing trip's details.</summary>
    Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default);

    /// <summary>Removes a trip (and optionally cancels related bookings).</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
