// Application service for the Bookings module.
// Coordinates business rule validation and delegates persistence to BookingsRepository.
// This is the only layer that should contain booking-specific business logic.

using JalemosBackend.Modules.Bookings.Domain;
using JalemosBackend.Modules.Bookings.Infrastructure;

namespace JalemosBackend.Modules.Bookings.Application;

/// <summary>
/// Implements the booking use cases defined in <see cref="IBookingsService"/>.
/// Depends on <see cref="BookingsRepository"/> for data access.
/// </summary>
public sealed class BookingsService : IBookingsService
{
    private readonly BookingsRepository _repository;

    /// <summary>Injects the data access repository via constructor injection.</summary>
    public BookingsService(BookingsRepository repository)
    {
        _repository = repository;
    }

    /// <inheritdoc/>
    public Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // TODO: apply filtering or pagination before forwarding to the repository
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // TODO: validate that the referenced trip still has available seats before creating
        return _repository.CreateAsync(booking, cancellationToken);
    }

    /// <inheritdoc/>
    public Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // TODO: verify the booking belongs to the requesting user before updating
        return _repository.UpdateAsync(booking, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: release the reserved seat back to the trip when a booking is deleted
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
