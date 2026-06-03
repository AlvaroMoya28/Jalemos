using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Ratings.Application.DTOs;
using JalemosBackend.Modules.Ratings.Domain;
using JalemosBackend.Modules.Ratings.Infrastructure;

namespace JalemosBackend.Modules.Ratings.Application;

public sealed class RatingsService : IRatingsService
{
    private readonly RatingsRepository _repo;
    private readonly ApplicationDbContext _db;

    public RatingsService(RatingsRepository repo, ApplicationDbContext db)
    {
        _repo = repo;
        _db   = db;
    }

    public Task<IEnumerable<Rating>> GetAllAsync(CancellationToken ct = default) =>
        _repo.GetAllAsync(ct);

    public Task<Rating?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _repo.GetByIdAsync(id, ct);

    public async Task<IEnumerable<RatingDto>> GetByRatedUserAsync(Guid ratedId, CancellationToken ct = default)
    {
        var ratings = await _repo.GetByRatedUserAsync(ratedId, ct);
        return ratings.Select(ToDto).ToList();
    }

    public async Task<RatingDto> SubmitAsync(SubmitRatingDto dto, Guid raterId, CancellationToken ct = default)
    {
        if (dto.Score < 1 || dto.Score > 5)
            throw new ArgumentException("La calificación debe ser entre 1 y 5 estrellas.");

        if (dto.RatedId == raterId)
            throw new InvalidOperationException("No puedes calificarte a ti mismo.");

        var trip = await _db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.TripId == dto.TripId, ct)
            ?? throw new KeyNotFoundException("Viaje no encontrado.");

        // Allow rating on completed trips, or cancelled trips where the driver cancelled late
        var isCompleted  = trip.State == TripState.Completed;
        var isCancelledLately = trip.State == TripState.Cancelled &&
                                trip.CancelledAt.HasValue &&
                                trip.BoardingStartedAt.HasValue; // boarding had started → late cancel

        if (!isCompleted && !isCancelledLately)
            throw new InvalidOperationException("Solo puedes calificar viajes completados o cancelados con poco tiempo de antelación.");

        // Verify rater participated
        var isDriver    = trip.DriverUserId == raterId;
        var isPassenger = await _db.Bookings.AnyAsync(
            b => b.TripId == dto.TripId && b.PassengerId == raterId && b.State != BookingState.Cancelled, ct);

        if (!isDriver && !isPassenger)
            throw new InvalidOperationException("Solo los participantes del viaje pueden dejar calificaciones.");

        // Check if rated person also participated
        var ratedIsDriver    = trip.DriverUserId == dto.RatedId;
        var ratedIsPassenger = await _db.Bookings.AnyAsync(
            b => b.TripId == dto.TripId && b.PassengerId == dto.RatedId && b.State != BookingState.Cancelled, ct);

        if (!ratedIsDriver && !ratedIsPassenger)
            throw new InvalidOperationException("El usuario calificado no participó en este viaje.");

        if (await _repo.ExistsAsync(dto.TripId, raterId, dto.RatedId, ct))
            throw new InvalidOperationException("Ya calificaste a este usuario por este viaje.");

        var rating = await _repo.CreateAsync(new Rating
        {
            TripId  = dto.TripId,
            RaterId = raterId,
            RatedId = dto.RatedId,
            Score   = dto.Score,
            Comment = dto.Comment,
        }, ct);

        // Send notification to rated user
        _db.Notifications.Add(new NotificationEntity
        {
            UserId = dto.RatedId,
            TripId = dto.TripId,
            Type   = NotificationType.RatingReceived,
            Title  = "Recibiste una calificación",
            Body   = $"{dto.Score} estrellas.{(dto.Comment is not null ? $" \"{dto.Comment}\"" : string.Empty)}",
        });
        await _db.SaveChangesAsync(ct);

        return ToDto(rating);
    }

    public async Task DeleteAsync(Guid id, Guid callerId, CancellationToken ct = default)
    {
        var rating = await _repo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException("Calificación no encontrada.");
        if (rating.RaterId != callerId)
            throw new UnauthorizedAccessException("Solo puedes eliminar tus propias calificaciones.");
        await _repo.DeleteAsync(id, ct);
    }

    private static RatingDto ToDto(Rating r) => new RatingDto
    {
        Id        = r.Id,
        TripId    = r.TripId,
        RaterId   = r.RaterId,
        RatedId   = r.RatedId,
        Score     = r.Score,
        Comment   = r.Comment,
        CreatedAt = r.CreatedAt,
    };
}
