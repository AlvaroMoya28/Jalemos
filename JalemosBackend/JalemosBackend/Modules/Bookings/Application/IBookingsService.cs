// Application contract for the Bookings module.
// Defines the use cases consumed by the presentation layer (controller).
// Implementations must enforce booking business rules before touching the repository.

using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Modules.Bookings.Application;

/// <summary>
/// Exposes the CRUD use cases for the Bookings domain.
/// All methods are async and accept a cancellation token for proper request cancellation.
/// </summary>
public interface IBookingsService
{
    /// <summary>Retrieves all bookings in the system.</summary>
    Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Retrieves a single booking by its unique identifier, or null if not found.</summary>
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Persists a new booking after applying domain validation rules.</summary>
    Task CreateAsync(Booking booking, CancellationToken cancellationToken = default);

    /// <summary>Updates an existing booking's data.</summary>
    Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default);

    /// <summary>Deletes the booking with the specified identifier.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
