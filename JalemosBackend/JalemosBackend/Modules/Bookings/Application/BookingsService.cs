// Application service for the Bookings module.
// Coordinates business rule validation and delegates persistence to BookingsRepository.
// This is the only layer that should contain booking-specific business logic.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Application.DTOs;
using JalemosBackend.Modules.Bookings.Domain;
using JalemosBackend.Modules.Bookings.Infrastructure;
using JalemosBackend.Modules.Notifications.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace JalemosBackend.Modules.Bookings.Application;

/// <summary>
/// Implements the booking use cases defined in <see cref="IBookingsService"/>.
/// Depends on <see cref="BookingsRepository"/> for data access.
/// </summary>
public sealed class BookingsService : IBookingsService
{
    private readonly BookingsRepository _repository;
    private readonly ApplicationDbContext _db;

    public BookingsService(BookingsRepository repository, ApplicationDbContext db)
    {
        _repository = repository;
        _db         = db;
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
    public async Task<BookingDto> CreateAsync(CreateBookingDto dto, Guid callerId, CancellationToken cancellationToken = default)
    {
        // Validate input DTO. 
        if (dto is null) throw new ArgumentNullException(nameof(dto));
        if (dto.TripId == Guid.Empty) throw new InvalidOperationException("tripId is required");
        if (dto.SeatsReserved <= 0) throw new InvalidOperationException("seatsReserved must be at least 1");

        // Map DTO -> Domain
        var booking = new Booking
        {
            TripId = dto.TripId,
            PassengerId = callerId,
            SeatsReserved = dto.SeatsReserved,
            EstimatedAmount = dto.EstimatedAmount ?? 0m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            State = BookingState.Pending
        };

        await _repository.CreateAsync(booking, cancellationToken);

        // Map Domain -> DTO
        var result = new BookingDto
        {
            Id = booking.Id,
            TripId = booking.TripId,
            PassengerId = booking.PassengerId,
            SeatsReserved = booking.SeatsReserved,
            EstimatedAmount = booking.EstimatedAmount,
            State = booking.State.ToString(),
            CreatedAt = booking.CreatedAt
        };

        return result;
    }

    /// <inheritdoc/>
    public async Task UpdateAsync(Booking booking, Guid callerId, CancellationToken cancellationToken = default)
    {
        if (booking is null) throw new ArgumentNullException(nameof(booking));

        // Ensure booking exists
        var existing = await _repository.GetByIdAsync(booking.Id, cancellationToken);
        if (existing is null) throw new InvalidOperationException("Booking not found");

        // Only the passenger who created the booking can update it
        if (existing.PassengerId != callerId) throw new UnauthorizedAccessException("No permission to update this booking");

        await _repository.UpdateAsync(booking, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task DeleteAsync(Guid id, Guid callerId, CancellationToken cancellationToken = default)
    {

        // Ensure booking exists
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return;

        // Only the passenger who created the booking can delete it
        if (existing.PassengerId != callerId) throw new UnauthorizedAccessException("No permission to delete this booking");

        await _repository.DeleteAsync(id, cancellationToken);
    }

    public async Task CancelBookingAsync(Guid id, string reason, string? details, Guid callerId, CancellationToken cancellationToken = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == id, cancellationToken)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");

        if (booking.PassengerId != callerId)
            throw new UnauthorizedAccessException("Solo el pasajero puede cancelar su propia reserva.");

        if (booking.State == BookingState.Cancelled || booking.State == BookingState.Completed)
            throw new InvalidOperationException("Esta reserva ya está cancelada o completada.");

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == booking.TripId, cancellationToken);

        booking.State        = BookingState.Cancelled;
        booking.CancelReason = reason;
        booking.CancelDetails = details;
        booking.UpdatedAt    = DateTime.UtcNow;

        var reasonLabel = reason switch
        {
            "plans_changed"      => "Cambio de planes",
            "found_alternative"  => "Encontró otra opción",
            "personal_emergency" => "Emergencia personal",
            _                    => "Otro motivo",
        };

        // Notify driver
        if (trip is not null)
        {
            var passenger = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == callerId, cancellationToken);
            var passengerName = passenger is null ? "Un pasajero" : $"{passenger.FirstName} {passenger.LastName}";
            _db.Notifications.Add(new NotificationEntity
            {
                UserId    = trip.DriverUserId,
                TripId    = trip.TripId,
                BookingId = booking.BookingId,
                Type      = NotificationType.PassengerCancelled,
                Title     = $"{passengerName} canceló su reserva",
                Body      = $"Motivo: {reasonLabel}. Revisa el estado de abordaje.",
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
