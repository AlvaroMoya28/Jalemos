using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Infrastructure;

public sealed class RatingsRepository
{
    private readonly ApplicationDbContext _db;
    public RatingsRepository(ApplicationDbContext db) => _db = db;

    private static Rating MapToDomain(RatingEntity e) => new Rating
    {
        Id        = e.RatingId,
        TripId    = e.TripId,
        RaterId   = e.RaterId,
        RatedId   = e.RatedId,
        Score     = e.Rating,
        Comment   = e.Comment,
        CreatedAt = e.CreatedAt,
    };

    public async Task<IEnumerable<Rating>> GetAllAsync(CancellationToken ct = default)
    {
        var rows = await _db.Ratings.AsNoTracking().ToListAsync(ct);
        return rows.Select(MapToDomain).ToList();
    }

    public async Task<Rating?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.Ratings.AsNoTracking().FirstOrDefaultAsync(r => r.RatingId == id, ct);
        return e is null ? null : MapToDomain(e);
    }

    public async Task<IEnumerable<Rating>> GetByRatedUserAsync(Guid ratedId, CancellationToken ct = default)
    {
        var rows = await _db.Ratings.AsNoTracking()
            .Where(r => r.RatedId == ratedId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
        return rows.Select(MapToDomain).ToList();
    }

    public async Task<bool> ExistsAsync(Guid tripId, Guid raterId, Guid ratedId, CancellationToken ct = default) =>
        await _db.Ratings.AnyAsync(r => r.TripId == tripId && r.RaterId == raterId && r.RatedId == ratedId, ct);

    public async Task<Rating> CreateAsync(Rating rating, CancellationToken ct = default)
    {
        var entity = new RatingEntity
        {
            RatingId  = rating.Id == Guid.Empty ? Guid.NewGuid() : rating.Id,
            TripId    = rating.TripId,
            RaterId   = rating.RaterId,
            RatedId   = rating.RatedId,
            Rating    = rating.Score,
            Comment   = rating.Comment,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Ratings.Add(entity);
        await _db.SaveChangesAsync(ct);
        rating.Id        = entity.RatingId;
        rating.CreatedAt = entity.CreatedAt;
        return rating;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.Ratings.FirstOrDefaultAsync(r => r.RatingId == id, ct);
        if (e is not null) { _db.Ratings.Remove(e); await _db.SaveChangesAsync(ct); }
    }
}
