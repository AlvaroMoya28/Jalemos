// Updated by Claude Sonnet 4.6: lifecycle state serialization (in_progress/no_show),
// boarding auto-expiry, and one-time rating gating so completed trips stop resurfacing.
using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Infrastructure;
using JalemosBackend.Modules.Trips.Application.DTOs;
using JalemosBackend.Modules.Trips.Infrastructure;

namespace JalemosBackend.Modules.Trips.Application;

/// <summary>
/// Orchestrates the full trip lifecycle: boarding → journey → completion/cancellation.
/// Cross-cuts trips, bookings, notifications, and users — uses DbContext directly.
/// </summary>
public sealed class TripLifecycleService : ITripLifecycleService
{
    private readonly ApplicationDbContext _db;
    private const int BoardingWindowMinutes = 5;  // driver can start boarding this many minutes before departure
    private const int NoShowGraceMinutes = 5;     // passenger has this long after departure to arrive
    private const int BoardingExpiryMinutes = 30; // boarding trips older than this past departure are auto-cancelled

    public TripLifecycleService(ApplicationDbContext db) => _db = db;

    // ──────────────────────────────────────────────────────────────────────
    // StartBoarding: scheduled → boarding (driver presses "Iniciar abordaje")
    // ──────────────────────────────────────────────────────────────────────
    public async Task<TripStatusDto> StartBoardingAsync(Guid tripId, Guid callerId, CancellationToken ct = default)
    {
        var trip = await _db.Trips.FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor puede iniciar el abordaje.");

        if (trip.State != TripState.Scheduled)
            throw new InvalidOperationException($"El viaje debe estar en estado 'scheduled' para iniciar el abordaje. Estado actual: {trip.State}.");

        var now = DateTime.UtcNow;
        var openAt = trip.StartDateTime.AddMinutes(-BoardingWindowMinutes);
        if (now < openAt)
        {
            var mins = (int)(openAt - now).TotalMinutes + 1;
            throw new InvalidOperationException($"Podrás iniciar el abordaje en {mins} minuto(s). El viaje sale a las {trip.StartDateTime:HH:mm} UTC.");
        }

        trip.State = TripState.Boarding;
        trip.BoardingStartedAt = now;
        await _db.SaveChangesAsync(ct);

        // Notify all confirmed passengers
        var bookings = await _db.Bookings
            .Where(b => b.TripId == tripId && (b.State == BookingState.Confirmed || b.State == BookingState.Pending))
            .ToListAsync(ct);

        var driver = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == callerId, ct);
        var driverName = driver is null ? "Tu conductor" : $"{driver.FirstName} {driver.LastName}";

        foreach (var b in bookings)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId    = b.PassengerId,
                TripId    = tripId,
                BookingId = b.BookingId,
                Type      = NotificationType.TripBoarding,
                Title     = "¡Tu conductor está listo!",
                Body      = $"{driverName} ha llegado al punto de encuentro. Dirígete al vehículo y muestra tu QR.",
            });
        }
        await _db.SaveChangesAsync(ct);

        return await BuildTripStatusAsync(trip, ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // ScanQr: driver scans passenger QR — marks booking as boarded
    // ──────────────────────────────────────────────────────────────────────
    public async Task<QrScanResultDto> ScanQrAsync(Guid tripId, string qrToken, Guid callerId, CancellationToken ct = default)
    {
        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor puede escanear QR.");

        if (trip.State != TripState.Boarding)
            throw new InvalidOperationException("El viaje debe estar en estado de abordaje para escanear QR.");

        if (!Guid.TryParse(qrToken, out var tokenGuid))
            throw new ArgumentException("QR inválido.");

        var passenger = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.QrToken == tokenGuid, ct)
            ?? throw new InvalidOperationException("No se encontró ningún usuario con ese QR.");

        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.TripId == tripId && b.PassengerId == passenger.UserId, ct)
            ?? throw new InvalidOperationException("Este usuario no tiene reserva en este viaje.");

        if (booking.State == BookingState.Cancelled || booking.State == BookingState.NoShow)
            throw new InvalidOperationException("La reserva de este pasajero fue cancelada o marcada como no presentado.");

        var alreadyBoarded = booking.State == BookingState.Boarded;

        if (!alreadyBoarded)
        {
            booking.State    = BookingState.Boarded;
            booking.BoardedAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            _db.Notifications.Add(new NotificationEntity
            {
                UserId    = passenger.UserId,
                TripId    = tripId,
                BookingId = booking.BookingId,
                Type      = NotificationType.QrScanned,
                Title     = "¡Ya estás registrado!",
                Body      = "Tu QR fue escaneado. Ya estás registrado en el vehículo. El viaje iniciará pronto.",
            });

            await _db.SaveChangesAsync(ct);
        }

        return new QrScanResultDto
        {
            BookingId      = booking.BookingId,
            PassengerId    = passenger.UserId,
            FirstName      = passenger.FirstName,
            LastName       = passenger.LastName,
            SeatsReserved  = booking.SeatsReserved,
            AlreadyBoarded = alreadyBoarded,
        };
    }

    // ──────────────────────────────────────────────────────────────────────
    // StartJourney: boarding → in_progress (all active passengers boarded)
    // ──────────────────────────────────────────────────────────────────────
    public async Task<TripStatusDto> StartJourneyAsync(Guid tripId, Guid callerId, CancellationToken ct = default)
    {
        var trip = await _db.Trips.FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor puede iniciar el viaje.");

        if (trip.State != TripState.Boarding)
            throw new InvalidOperationException("El viaje debe estar en estado de abordaje para iniciar.");

        // Check no pending/confirmed bookings remain
        var pending = await _db.Bookings
            .AnyAsync(b => b.TripId == tripId && (b.State == BookingState.Pending || b.State == BookingState.Confirmed), ct);

        if (pending)
            throw new InvalidOperationException("Aún hay pasajeros que no han llegado. Márcalos como 'no presentado' o espera que escaneen su QR.");

        trip.State = TripState.InProgress;
        trip.JourneyStartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Notify all boarded passengers
        var boardedPassengerIds = await _db.Bookings
            .Where(b => b.TripId == tripId && b.State == BookingState.Boarded)
            .Select(b => b.PassengerId)
            .ToListAsync(ct);

        foreach (var pid in boardedPassengerIds)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId = pid,
                TripId = tripId,
                Type   = NotificationType.TripStarted,
                Title  = "¡El viaje comenzó!",
                Body   = "Abróchate el cinturón y disfruta el camino.",
            });
        }
        await _db.SaveChangesAsync(ct);

        return await BuildTripStatusAsync(trip, ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // CompleteTrip: in_progress → completed
    // ──────────────────────────────────────────────────────────────────────
    public async Task<TripStatusDto> CompleteTripAsync(Guid tripId, Guid callerId, CancellationToken ct = default)
    {
        var trip = await _db.Trips.FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor puede completar el viaje.");

        if (trip.State != TripState.InProgress)
            throw new InvalidOperationException("El viaje debe estar en curso para completarlo.");

        trip.State = TripState.Completed;
        trip.CompletedAt = DateTime.UtcNow;

        // Complete all boarded bookings and increment passenger trip counts
        var boardedBookings = await _db.Bookings
            .Where(b => b.TripId == tripId && b.State == BookingState.Boarded)
            .ToListAsync(ct);

        var passengerIds = boardedBookings.Select(b => b.PassengerId).ToList();

        foreach (var b in boardedBookings)
        {
            b.State     = BookingState.Completed;
            b.UpdatedAt = DateTime.UtcNow;
        }

        // Increment trip counters
        await _db.Users
            .Where(u => passengerIds.Contains(u.UserId))
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.TotalTrips, u => u.TotalTrips + 1), ct);

        await _db.Users
            .Where(u => u.UserId == callerId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.TotalTrips, u => u.TotalTrips + 1)
                .SetProperty(u => u.DriverTrips, u => u.DriverTrips + 1), ct);

        await _db.SaveChangesAsync(ct);

        // Payment reminder to passengers + rating reminders to all
        foreach (var pid in passengerIds)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId = pid,
                TripId = tripId,
                Type   = NotificationType.PaymentReminder,
                Title  = "¡Viaje completado!",
                Body   = "Recuerda realizar el pago a tu conductor (efectivo o Sinpe Móvil).",
            });
            _db.Notifications.Add(new NotificationEntity
            {
                UserId = pid,
                TripId = tripId,
                Type   = NotificationType.RatingReminder,
                Title  = "¿Cómo fue tu viaje?",
                Body   = "Califica tu experiencia y ayuda a mejorar la comunidad.",
            });
        }

        _db.Notifications.Add(new NotificationEntity
        {
            UserId = callerId,
            TripId = tripId,
            Type   = NotificationType.PaymentReminder,
            Title  = "¡Viaje completado!",
            Body   = "Recuerda cobrarles el pago a tus pasajeros.",
        });
        _db.Notifications.Add(new NotificationEntity
        {
            UserId = callerId,
            TripId = tripId,
            Type   = NotificationType.RatingReminder,
            Title  = "Califica a tus pasajeros",
            Body   = "Deja una reseña de tus pasajeros para esta comunidad.",
        });

        await _db.SaveChangesAsync(ct);
        return await BuildTripStatusAsync(trip, ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // CancelTrip: any active state → cancelled
    // ──────────────────────────────────────────────────────────────────────
    public async Task CancelTripAsync(Guid tripId, string reason, string? details, Guid callerId, bool isAdmin, CancellationToken ct = default)
    {
        var trip = await _db.Trips.FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId && !isAdmin)
            throw new UnauthorizedAccessException("No tienes permiso para cancelar este viaje.");

        if (trip.State == TripState.Completed || trip.State == TripState.Cancelled)
            throw new InvalidOperationException("El viaje ya está completado o cancelado.");

        var now = DateTime.UtcNow;
        var minutesBeforeDeparture = (trip.StartDateTime - now).TotalMinutes;
        var isLateCancel = minutesBeforeDeparture < 60;

        trip.State        = TripState.Cancelled;
        trip.CancelledAt  = now;
        trip.CancelReason = reason;
        trip.CancelDetails = details;

        // Cancel all pending/confirmed bookings
        var activeBookings = await _db.Bookings
            .Where(b => b.TripId == tripId && (b.State == BookingState.Pending || b.State == BookingState.Confirmed || b.State == BookingState.Boarded))
            .ToListAsync(ct);

        var passengerIds = activeBookings.Select(b => b.PassengerId).Distinct().ToList();

        foreach (var b in activeBookings.Where(b => b.State != BookingState.Boarded))
        {
            b.State     = BookingState.Cancelled;
            b.UpdatedAt = now;
            // Seats are released by the DB trigger
        }

        await _db.SaveChangesAsync(ct);

        // Notify passengers
        var reasonLabel = reason switch
        {
            "vehicle_issue"      => "Problema con el vehículo",
            "personal_emergency" => "Emergencia personal",
            "traffic_problem"    => "Problema de tránsito",
            "route_change"       => "Cambio de ruta",
            _                    => "Otro motivo",
        };

        foreach (var pid in passengerIds)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId = pid,
                TripId = tripId,
                Type   = NotificationType.DriverCancelled,
                Title  = "Viaje cancelado por el conductor",
                Body   = $"Tu conductor canceló el viaje. Motivo: {reasonLabel}.{(details is not null ? $" Detalle: {details}" : string.Empty)}{(isLateCancel ? " Puedes calificar al conductor." : string.Empty)}",
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // MarkNoShow: driver marks a passenger as no-show after grace period
    // ──────────────────────────────────────────────────────────────────────
    public async Task MarkNoShowAsync(Guid bookingId, Guid callerId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId, ct)
            ?? throw new KeyNotFoundException("Reserva no encontrada.");

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == booking.TripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        if (trip.DriverUserId != callerId)
            throw new UnauthorizedAccessException("Solo el conductor puede marcar pasajeros como no presentados.");

        if (trip.State != TripState.Boarding)
            throw new InvalidOperationException("Solo se puede marcar no presentado durante el abordaje.");

        if (booking.State != BookingState.Confirmed && booking.State != BookingState.Pending)
            throw new InvalidOperationException("Solo se pueden marcar como no presentados los pasajeros con reserva activa.");

        var graceDeadline = trip.StartDateTime.AddMinutes(NoShowGraceMinutes);
        if (DateTime.UtcNow < graceDeadline)
        {
            var remaining = (int)(graceDeadline - DateTime.UtcNow).TotalMinutes + 1;
            throw new InvalidOperationException($"El pasajero tiene {remaining} minuto(s) más para llegar (período de gracia de {NoShowGraceMinutes} minutos).");
        }

        booking.State     = BookingState.NoShow;
        booking.UpdatedAt = DateTime.UtcNow;

        _db.Notifications.Add(new NotificationEntity
        {
            UserId    = booking.PassengerId,
            TripId    = trip.TripId,
            BookingId = bookingId,
            Type      = NotificationType.NoShowMarked,
            Title     = "Marcado como no presentado",
            Body      = "El conductor te marcó como no presentado. El viaje continuará sin ti.",
        });

        await _db.SaveChangesAsync(ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // GetTripStatus: full status for driver or any participant
    // ──────────────────────────────────────────────────────────────────────
    public async Task<TripStatusDto> GetTripStatusAsync(Guid tripId, Guid callerId, CancellationToken ct = default)
    {
        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == tripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        var isDriver    = trip.DriverUserId == callerId;
        var isPassenger = await _db.Bookings.AnyAsync(b => b.TripId == tripId && b.PassengerId == callerId && b.State != BookingState.Cancelled, ct);

        if (!isDriver && !isPassenger)
            throw new UnauthorizedAccessException("No tienes acceso al estado de este viaje.");

        return await BuildTripStatusAsync(trip, ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // GetActiveDriverTrip: driver's current boarding/in_progress trip
    // ──────────────────────────────────────────────────────────────────────
    public async Task<TripStatusDto?> GetActiveDriverTripAsync(Guid driverId, CancellationToken ct = default)
    {
        // Auto-cancel scheduled trips that are 5+ minutes past departure
        await ExpireScheduledTripsAsync(driverId, isDriver: true, ct);
        // Auto-cancel boarding trips that are 30+ minutes past departure (stuck boarding)
        await ExpireStuckBoardingTripsAsync(driverId, ct);

        var trip = await _db.Trips.AsNoTracking()
            .Where(t => t.DriverUserId == driverId && (t.State == TripState.Boarding || t.State == TripState.InProgress))
            .OrderByDescending(t => t.StartDateTime)
            .FirstOrDefaultAsync(ct);

        return trip is null ? null : await BuildTripStatusAsync(trip, ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // GetActivePassengerTrip: passenger's current active trip/booking
    // ──────────────────────────────────────────────────────────────────────
    public async Task<ActivePassengerTripDto?> GetActivePassengerTripAsync(Guid passengerId, CancellationToken ct = default)
    {
        // Auto-cancel expired trips visible to this passenger too
        await ExpireScheduledTripsAsync(passengerId, isDriver: false, ct);

        var recentWindow = DateTime.UtcNow.AddHours(-2);
        // Include cancelled bookings from the last 2 hours so the passenger sees the cancellation alert
        var booking = await _db.Bookings.AsNoTracking()
            .Where(b => b.PassengerId == passengerId && b.UpdatedAt >= recentWindow)
            .OrderByDescending(b => b.UpdatedAt)
            .FirstOrDefaultAsync(ct);

        if (booking is null) return null;

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == booking.TripId, ct);
        if (trip is null) return null;

        // Surface boarding, in_progress, and recently cancelled (so passenger gets notified)
        // Completed trips surface for ratings
        var validStates = new[] { TripState.Boarding, TripState.InProgress, TripState.Completed, TripState.Cancelled };
        if (!validStates.Contains(trip.State))
            return null;

        // Cancelled trips are only returned for 15 min — just enough for the one-time notification.
        // After that the API returns null so the bubble disappears on its own.
        if (trip.State == TripState.Cancelled &&
            trip.CancelledAt.HasValue &&
            (DateTime.UtcNow - trip.CancelledAt.Value).TotalMinutes > 15)
            return null;

        // Completed trips surface only so the passenger can rate the driver ONCE.
        // Stop returning the trip as soon as the passenger has rated, or after a 60-min
        // grace window if they skipped — so the rating prompt never reappears on every login.
        if (trip.State == TripState.Completed)
        {
            var alreadyRated = await _db.Ratings.AsNoTracking().AnyAsync(
                r => r.TripId == trip.TripId && r.RaterId == passengerId && r.RatedId == trip.DriverUserId, ct);

            var pastGrace = trip.CompletedAt.HasValue &&
                            (DateTime.UtcNow - trip.CompletedAt.Value).TotalMinutes > 60;

            if (alreadyRated || pastGrace)
                return null;
        }

        var driver = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == trip.DriverUserId, ct);

        // Late cancellation = driver cancelled < 60 min BEFORE departure (not auto-expired).
        // Auto-expired trips have cancelledAt > departureAt, so they are NOT late cancellations.
        var isLateCancellation = trip.State == TripState.Cancelled &&
            trip.CancelReason != "expired" &&
            trip.CancelledAt.HasValue &&
            trip.CancelledAt.Value < trip.StartDateTime &&          // cancelled BEFORE departure
            (trip.StartDateTime - trip.CancelledAt.Value).TotalMinutes < 60; // within 60 min

        return new ActivePassengerTripDto
        {
            TripId               = trip.TripId,
            TripState            = StateStr(trip.State),
            Origin               = trip.FromLocation,
            Destination          = trip.ToLocation,
            OriginLatitude       = trip.FromLatitude,
            OriginLongitude      = trip.FromLongitude,
            DestinationLatitude  = trip.ToLatitude,
            DestinationLongitude = trip.ToLongitude,
            DepartureAt          = trip.StartDateTime,
            Rate                 = trip.Rate,
            DriverId             = trip.DriverUserId,
            DriverFirstName      = driver?.FirstName ?? string.Empty,
            DriverLastName       = driver?.LastName  ?? string.Empty,
            DriverRating         = driver?.MeanRating ?? 0,
            BoardingStartedAt    = trip.BoardingStartedAt,
            JourneyStartedAt     = trip.JourneyStartedAt,
            CancelledAt          = trip.CancelledAt,
            CancelReason         = trip.CancelReason,
            CancelDetails        = trip.CancelDetails,
            IsLateCancellation   = isLateCancellation,
            BookingId            = booking.BookingId,
            BookingState         = StateStr(booking.State),
            BoardedAt            = booking.BoardedAt,
        };
    }

    // ──────────────────────────────────────────────────────────────────────
    // Auto-expire: cancel boarding trips that are BoardingExpiryMinutes past departure.
    // This unblocks drivers whose boarding phase never completed (no passengers showed up,
    // or they left the app mid-boarding) so they can offer a new trip.
    // ──────────────────────────────────────────────────────────────────────
    private async Task ExpireStuckBoardingTripsAsync(Guid driverId, CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.AddMinutes(-BoardingExpiryMinutes);

        var stuck = await _db.Trips
            .Where(t => t.DriverUserId == driverId &&
                        t.State == TripState.Boarding &&
                        t.StartDateTime < threshold)
            .ToListAsync(ct);

        if (!stuck.Any()) return;

        var now = DateTime.UtcNow;
        foreach (var trip in stuck)
        {
            trip.State         = TripState.Cancelled;
            trip.CancelledAt   = now;
            trip.CancelReason  = "expired";
            trip.CancelDetails = "El abordaje no fue completado a tiempo.";

            var activeBookings = await _db.Bookings
                .Where(b => b.TripId == trip.TripId &&
                            (b.State == BookingState.Pending || b.State == BookingState.Confirmed))
                .ToListAsync(ct);

            foreach (var b in activeBookings)
            {
                b.State        = BookingState.Cancelled;
                b.CancelReason = "expired";
                b.UpdatedAt    = now;

                _db.Notifications.Add(new NotificationEntity
                {
                    UserId = b.PassengerId,
                    TripId = trip.TripId,
                    Type   = NotificationType.DriverCancelled,
                    Title  = "Viaje vencido",
                    Body   = "El abordaje no fue completado. El viaje fue cancelado automáticamente.",
                });
            }

            _db.Notifications.Add(new NotificationEntity
            {
                UserId = driverId,
                TripId = trip.TripId,
                Type   = NotificationType.General,
                Title  = "Viaje vencido",
                Body   = "Un viaje en abordaje fue cancelado automáticamente por tiempo de espera.",
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Auto-expire: cancel scheduled trips that are 5+ min past departure
    // Called on every poll to keep state consistent.
    // ──────────────────────────────────────────────────────────────────────
    private async Task ExpireScheduledTripsAsync(Guid userId, bool isDriver, CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.AddMinutes(-5);

        IQueryable<TripEntity> query = _db.Trips
            .Where(t => t.State == TripState.Scheduled && t.StartDateTime < threshold);

        query = isDriver
            ? query.Where(t => t.DriverUserId == userId)
            : query.Where(t => _db.Bookings.Any(b =>
                b.TripId == t.TripId && b.PassengerId == userId &&
                (b.State == BookingState.Pending || b.State == BookingState.Confirmed)));

        var expired = await query.ToListAsync(ct);
        if (!expired.Any()) return;

        var now = DateTime.UtcNow;
        foreach (var trip in expired)
        {
            trip.State        = TripState.Cancelled;
            trip.CancelledAt  = now;
            trip.CancelReason = "expired";
            trip.CancelDetails = "El conductor no inició el abordaje a tiempo.";

            var activeBookings = await _db.Bookings
                .Where(b => b.TripId == trip.TripId &&
                            (b.State == BookingState.Pending || b.State == BookingState.Confirmed))
                .ToListAsync(ct);

            foreach (var b in activeBookings)
            {
                b.State        = BookingState.Cancelled;
                b.CancelReason = "expired";
                b.UpdatedAt    = now;

                _db.Notifications.Add(new NotificationEntity
                {
                    UserId = b.PassengerId,
                    TripId = trip.TripId,
                    Type   = NotificationType.DriverCancelled,
                    Title  = "Viaje vencido",
                    Body   = "El conductor no llegó a tiempo. El viaje fue cancelado automáticamente.",
                });
            }

            if (isDriver)
            {
                _db.Notifications.Add(new NotificationEntity
                {
                    UserId = trip.DriverUserId,
                    TripId = trip.TripId,
                    Type   = NotificationType.General,
                    Title  = "Viaje vencido",
                    Body   = "Uno de tus viajes fue cancelado automáticamente porque no iniciaste el abordaje a tiempo.",
                });
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────

    // ToString().ToLower() produces "inprogress" and "noshow" — wrong.
    // These helpers produce the underscore form the frontend expects.
    private static string StateStr(TripState s) => s switch
    {
        TripState.InProgress => "in_progress",
        _ => s.ToString().ToLower()
    };

    private static string StateStr(BookingState s) => s switch
    {
        BookingState.NoShow => "no_show",
        _ => s.ToString().ToLower()
    };

    private async Task<TripStatusDto> BuildTripStatusAsync(TripEntity trip, CancellationToken ct)
    {
        var driver = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == trip.DriverUserId, ct);

        var bookings = await _db.Bookings.AsNoTracking()
            .Where(b => b.TripId == trip.TripId && b.State != BookingState.Cancelled)
            .ToListAsync(ct);

        var passengerIds = bookings.Select(b => b.PassengerId).Distinct().ToList();
        var passengers   = await _db.Users.AsNoTracking()
            .Where(u => passengerIds.Contains(u.UserId))
            .ToListAsync(ct);
        var pMap = passengers.ToDictionary(u => u.UserId);

        var summaries = bookings.Select(b =>
        {
            pMap.TryGetValue(b.PassengerId, out var p);
            return new PassengerSummaryDto
            {
                BookingId     = b.BookingId,
                PassengerId   = b.PassengerId,
                FirstName     = p?.FirstName ?? string.Empty,
                LastName      = p?.LastName  ?? string.Empty,
                SeatsReserved = b.SeatsReserved,
                BookingState  = StateStr(b.State),
                BoardedAt     = b.BoardedAt,
            };
        }).ToList();

        return new TripStatusDto
        {
            TripId               = trip.TripId,
            State                = StateStr(trip.State),
            Origin               = trip.FromLocation,
            Destination          = trip.ToLocation,
            OriginLatitude       = trip.FromLatitude,
            OriginLongitude      = trip.FromLongitude,
            DestinationLatitude  = trip.ToLatitude,
            DestinationLongitude = trip.ToLongitude,
            DepartureAt          = trip.StartDateTime,
            Rate                 = trip.Rate,
            DriverId             = trip.DriverUserId,
            DriverFirstName      = driver?.FirstName ?? string.Empty,
            DriverLastName       = driver?.LastName  ?? string.Empty,
            BoardingStartedAt    = trip.BoardingStartedAt,
            JourneyStartedAt     = trip.JourneyStartedAt,
            CompletedAt          = trip.CompletedAt,
            CancelledAt          = trip.CancelledAt,
            CancelReason         = trip.CancelReason,
            CancelDetails        = trip.CancelDetails,
            Passengers           = summaries,
        };
    }
}
