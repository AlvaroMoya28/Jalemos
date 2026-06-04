// Application contract for the Bookings module.
// Defines the use cases consumed by the presentation layer (controller).
// Implementations must enforce booking business rules before touching the repository.

using JalemosBackend.Modules.Bookings.Application.DTOs;
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

    /// <summary>Creates a new booking from a client DTO. CallerId is the authenticated passenger creating the booking.
    /// Returns a DTO representing the created booking.</summary>
    Task<BookingDto> CreateAsync(CreateBookingDto dto, Guid callerId, CancellationToken cancellationToken = default);

    /// <summary>Updates an existing booking's data. CallerId is used to enforce ownership.</summary>
    Task UpdateAsync(Booking booking, Guid callerId, CancellationToken cancellationToken = default);

    /// <summary>Deletes the booking with the specified identifier. CallerId is used to enforce ownership.</summary>
    Task DeleteAsync(Guid id, Guid callerId, CancellationToken cancellationToken = default);

    /// <summary>Passenger cancels their own booking with a reason. Notifies the driver.</summary>
    Task CancelBookingAsync(Guid id, string reason, string? details, Guid callerId, CancellationToken cancellationToken = default);

    /// <summary>Returns the passenger's own bookings with an embedded trip snapshot (all states).</summary>
    Task<IEnumerable<MyBookingDto>> GetMyBookingsWithTripsAsync(Guid passengerId, CancellationToken cancellationToken = default);
}

/// <summary>Booking history item with embedded trip snapshot — returned by GET /api/bookings/mine.</summary>
public sealed class MyBookingDto
{
    public Guid   BookingId      { get; init; }
    public Guid   TripId         { get; init; }
    public string BookingState   { get; init; } = string.Empty;
    public short  SeatsReserved  { get; init; }
    public decimal EstimatedAmount { get; init; }
    public string? CancelReason  { get; init; }
    public DateTime CreatedAt    { get; init; }
    // Trip snapshot
    public string  Origin         { get; init; } = string.Empty;
    public string  Destination    { get; init; } = string.Empty;
    public DateTime? DepartureAt  { get; init; }
    public string? TripState      { get; init; }
    public decimal? Rate          { get; init; }
    public Guid    DriverId        { get; init; }
    public string  DriverFirstName { get; init; } = string.Empty;
    public string  DriverLastName  { get; init; } = string.Empty;
    public decimal DriverRating    { get; init; }
    public int     DriverTrips     { get; init; }
    public DateTime? DriverCreatedAt { get; init; }
}
