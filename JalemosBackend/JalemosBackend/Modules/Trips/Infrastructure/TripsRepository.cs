using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Trips.Application;
using JalemosBackend.Modules.Trips.Domain;
//using JalemosBackend.Modules.Trips.Infrastructure.Entities;

namespace JalemosBackend.Modules.Trips.Infrastructure;

/// <summary>
/// Provides raw CRUD operations against the trips table in the shared database.
/// </summary>
public sealed class TripsRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public TripsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public static Trip MapToDomain(TripEntity e) => new Trip
    {
       Id = e.TripId,
       DriverId = e.DriverUserId,
       VehicleId = e.VehicleId,
       Rate = e.Rate,
       Origin = e.FromLocation,
       Destination = e.ToLocation,
       OriginLatitude = e.FromLatitude,   
       OriginLongitude = e.FromLongitude,
       DestinationLatitude = e.ToLatitude,
       DestinationLongitude = e.ToLongitude,
       DepartureAt = e.StartDateTime,
       TotalSeats = e.TotalSeats,
       AvailableSeats = e.AvailableSeats,
       CreatedAt = e.CreatedAt,
       State = e.State,
       Notes = e.Notes ?? string.Empty

    };

    public static TripEntity MapToEntity(Trip d) => new TripEntity
    {
        TripId = d.Id,
        DriverUserId = d.DriverId,
        VehicleId = d.VehicleId,
        Rate = d.Rate,
        FromLocation = d.Origin,
        ToLocation = d.Destination,
        FromLatitude = d.OriginLatitude,
        FromLongitude = d.OriginLongitude,
        ToLatitude = d.DestinationLatitude,
        ToLongitude = d.DestinationLongitude,
        StartDateTime = d.DepartureAt,
        TotalSeats = d.TotalSeats,
        AvailableSeats = d.AvailableSeats,
        CreatedAt = d.CreatedAt,
        State = d.State,
        Notes = d.Notes
    };

    /// <summary>Fetches all trip records, mapping in memory after materialisation.</summary>
    public async Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var entities = await _dbContext.Trips.AsNoTracking().ToListAsync(cancellationToken);
        return entities.Select(MapToDomain).ToList();
    }

    /// <summary>Fetches upcoming scheduled trips joined with their driver's user record.
    /// Excludes trips whose departure time has already passed.</summary>
    public async Task<IEnumerable<TripDto>> GetAllWithDriverAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var trips = await _dbContext.Trips.AsNoTracking()
            .Where(t => t.State == TripState.Scheduled && t.StartDateTime > now)
            .ToListAsync(cancellationToken);
        var driverIds = trips.Select(t => t.DriverUserId).Distinct().ToList();
        var users = await _dbContext.Users.AsNoTracking()
            .Where(u => driverIds.Contains(u.UserId))
            .ToListAsync(cancellationToken);
        var userMap = users.ToDictionary(u => u.UserId);

        return trips.Select(t =>
        {
            userMap.TryGetValue(t.DriverUserId, out var u);
            return new TripDto
            {
                Id                   = t.TripId,
                DriverId             = t.DriverUserId,
                DriverFirstName      = u?.FirstName  ?? string.Empty,
                DriverLastName       = u?.LastName   ?? string.Empty,
                DriverMeanRating     = u?.MeanRating ?? 0,
                DriverTotalTrips     = u?.TotalTrips ?? 0,
                DriverCreatedAt      = u?.CreatedAt  ?? DateTime.MinValue,
                VehicleId            = t.VehicleId,
                Rate                 = t.Rate,
                Origin               = t.FromLocation,
                Destination          = t.ToLocation,
                OriginLatitude       = t.FromLatitude,
                OriginLongitude      = t.FromLongitude,
                DestinationLatitude  = t.ToLatitude,
                DestinationLongitude = t.ToLongitude,
                DepartureAt          = t.StartDateTime,
                TotalSeats           = t.TotalSeats,
                AvailableSeats       = t.AvailableSeats,
                Notes                = t.Notes ?? string.Empty,
                State                = t.State.ToString(),
                CreatedAt            = t.CreatedAt,
            };
        }).ToList();
    }

    /// <summary>Finds a trip by its primary key. Returns null when not found.</summary>
    public async Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Trips.AsNoTracking().FirstOrDefaultAsync(x => x.TripId == id, cancellationToken);
        return e is null ? null : MapToDomain(e);
    }

    /// <summary>Inserts a new trip. Enforces a 1-hour buffer between active trips for the same driver.</summary>
    public async Task CreateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        var windowStart = trip.DepartureAt.AddMinutes(-60);
        var windowEnd   = trip.DepartureAt.AddMinutes(60);

        var hasConflict = await _dbContext.Trips.AnyAsync(t =>
            t.DriverUserId == trip.DriverId &&
            t.State != TripState.Cancelled &&
            t.State != TripState.Completed &&
            t.StartDateTime >= windowStart &&
            t.StartDateTime <= windowEnd,
            cancellationToken);

        if (hasConflict)
            throw new InvalidOperationException(
                "Ya tienes un viaje programado dentro de 1 hora de ese horario. " +
                "Debe haber al menos 1 hora de diferencia entre tus viajes.");

        var entity = new TripEntity
        {
            TripId         = trip.Id == Guid.Empty ? Guid.NewGuid() : trip.Id,
            DriverUserId   = trip.DriverId,
            VehicleId      = trip.VehicleId,
            Rate           = trip.Rate,
            FromLocation   = trip.Origin,
            ToLocation     = trip.Destination,
            FromLatitude   = trip.OriginLatitude,
            FromLongitude  = trip.OriginLongitude,
            ToLatitude     = trip.DestinationLatitude,
            ToLongitude    = trip.DestinationLongitude,
            StartDateTime  = trip.DepartureAt,
            TotalSeats     = trip.TotalSeats,
            AvailableSeats = trip.AvailableSeats,
            CreatedAt      = trip.CreatedAt,
            State          = trip.State,
            Notes          = trip.Notes,
        };
        _dbContext.Trips.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        trip.Id = entity.TripId;
    }

    /// <summary>Updates an existing trip row.</summary>
    public Task UpdateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Trips.Update(ride); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Deletes the trip row with the specified id.</summary>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: find entity by id, call Remove(), then SaveChangesAsync
        return Task.CompletedTask;
    }
}
