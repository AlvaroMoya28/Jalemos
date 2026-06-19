// Application service for the Bookings module.
// Coordinates business rule validation and delegates persistence to BookingsRepository.
// Updated by Claude Sonnet 4.6: "my bookings" history endpoint with embedded trip snapshot.
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

        // Notify the driver that a passenger reserved a seat on their trip (E1-2).
        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == booking.TripId, cancellationToken);
        if (trip is not null)
        {
            var passenger = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == callerId, cancellationToken);
            var passengerName = passenger is null ? "Un pasajero" : $"{passenger.FirstName} {passenger.LastName}";
            var seatLabel = booking.SeatsReserved == 1 ? "un espacio" : $"{booking.SeatsReserved} espacios";
            _db.Notifications.Add(new NotificationEntity
            {
                UserId    = trip.DriverUserId,
                TripId    = trip.TripId,
                BookingId = booking.Id,
                Type      = NotificationType.BookingReceived,
                Title     = $"{passengerName} reservó {seatLabel}",
                Body      = $"Viaje {trip.FromLocation} → {trip.ToLocation}.",
            });
            await _db.SaveChangesAsync(cancellationToken);
        }

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

    public async Task<IEnumerable<MyBookingDto>> GetMyBookingsWithTripsAsync(Guid passengerId, CancellationToken cancellationToken = default)
    {
        var bookings = await _db.Bookings.AsNoTracking()
            .Where(b => b.PassengerId == passengerId)
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync(cancellationToken);

        var tripIds   = bookings.Select(b => b.TripId).Distinct().ToList();
        var trips     = await _db.Trips.AsNoTracking().Where(t => tripIds.Contains(t.TripId)).ToListAsync(cancellationToken);
        var driverIds = trips.Select(t => t.DriverUserId).Distinct().ToList();
        var drivers   = await _db.Users.AsNoTracking().Where(u => driverIds.Contains(u.UserId)).ToListAsync(cancellationToken);

        var tripMap   = trips.ToDictionary(t => t.TripId);
        var driverMap = drivers.ToDictionary(u => u.UserId);

        return bookings.Select(b =>
        {
            tripMap.TryGetValue(b.TripId, out var trip);
            driverMap.TryGetValue(trip?.DriverUserId ?? Guid.Empty, out var driver);
            return new MyBookingDto
            {
                BookingId       = b.BookingId,
                TripId          = b.TripId,
                BookingState    = BookingStr(b.State),
                SeatsReserved   = b.SeatsReserved,
                EstimatedAmount = b.EstimatedAmount,
                CancelReason    = b.CancelReason,
                CreatedAt       = b.CreatedAt,
                Origin          = trip?.FromLocation  ?? string.Empty,
                Destination     = trip?.ToLocation    ?? string.Empty,
                DepartureAt     = trip?.StartDateTime,
                TripState       = trip is null ? null : TripStr(trip.State),
                Rate            = trip?.Rate,
                DriverId        = trip?.DriverUserId ?? Guid.Empty,
                DriverFirstName = driver?.FirstName  ?? string.Empty,
                DriverLastName  = driver?.LastName   ?? string.Empty,
                DriverRating    = driver?.MeanRating ?? 0m,
                DriverTrips     = driver?.TotalTrips ?? 0,
                DriverCreatedAt = driver?.CreatedAt,
            };
        }).ToList();
    }

    private static string BookingStr(BookingState s) => s switch
    {
        BookingState.NoShow => "no_show",
        _ => s.ToString().ToLower()
    };

    private static string TripStr(TripState s) => s switch
    {
        TripState.InProgress => "in_progress",
        _ => s.ToString().ToLower()
    };

    public async Task CancelBookingAsync(Guid id, string reason, string? details, Guid callerId, CancellationToken cancellationToken = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == id, cancellationToken)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");

        if (booking.PassengerId != callerId)
            throw new UnauthorizedAccessException("Solo el pasajero puede cancelar su propia reserva.");

        if (booking.State == BookingState.Cancelled || booking.State == BookingState.Completed)
            throw new InvalidOperationException("Esta reserva ya está cancelada o completada.");

        var trip = await _db.Trips.FirstOrDefaultAsync(t => t.TripId == booking.TripId, cancellationToken);

        if (trip is not null && trip.State is TripState.InProgress or TripState.Completed or TripState.Cancelled)
            throw new InvalidOperationException("No puedes cancelar una reserva de un viaje ya iniciado o completado.");

        var isLate = trip is not null &&
                     (trip.StartDateTime - DateTime.UtcNow).TotalMinutes < 30;

        booking.State         = BookingState.Cancelled;
        booking.CancelReason  = reason;
        booking.CancelDetails = details;
        booking.IsLateCancel  = isLate;
        booking.UpdatedAt     = DateTime.UtcNow;

        if (trip is not null)
            trip.AvailableSeats = (short)(trip.AvailableSeats + booking.SeatsReserved);

        var reasonLabel = reason switch
        {
            "plans_changed"      => "Cambio de planes",
            "found_alternative"  => "Encontró otra opción",
            "personal_emergency" => "Emergencia personal",
            _                    => "Otro motivo",
        };

        if (trip is not null)
        {
            var passenger = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == callerId, cancellationToken);
            var passengerName = passenger is null ? "Un pasajero" : $"{passenger.FirstName} {passenger.LastName}";
            var body = isLate
                ? $"Motivo: {reasonLabel}. Cancelación tardía — puedes calificar al pasajero."
                : $"Motivo: {reasonLabel}. El asiento quedó disponible.";
            _db.Notifications.Add(new NotificationEntity
            {
                UserId      = trip.DriverUserId,
                TripId      = trip.TripId,
                BookingId   = booking.BookingId,
                PassengerId = isLate ? callerId : null,
                Type        = isLate ? NotificationType.PassengerCancelledLate : NotificationType.PassengerCancelled,
                Title       = isLate
                    ? $"{passengerName} canceló su reserva tardíamente"
                    : $"{passengerName} canceló su reserva",
                Body        = body,
                Audience    = "driver",
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
