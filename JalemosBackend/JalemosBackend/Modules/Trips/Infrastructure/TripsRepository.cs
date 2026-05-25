using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Trips.Domain;
//using JalemosBackend.Modules.Trips.Infrastructure.Entities;

namespace JalemosBackend.Modules.Rides.Infrastructure;

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
        StartDateTime = d.DepartureAt,
        TotalSeats = d.TotalSeats,
        AvailableSeats = d.AvailableSeats,
        CreatedAt = d.CreatedAt,
        State = d.State,
        Notes = d.Notes
    };

    /// <summary>Fetches all trip records. Replace with <c>_dbContext.Trips.ToListAsync()</c>.</summary>
    public async Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Trips.AsNoTracking().Select(e => MapToDomain(e)).ToListAsync(cancellationToken);
    }

    /// <summary>Finds a trip by its primary key. Returns null when not found.</summary>
    public async Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _dbContext.Trips.AsNoTracking().FirstOrDefaultAsync(x => x.TripId == id, cancellationToken);
        return e is null ? null : MapToDomain(e);
    }

    /// <summary>Inserts a new trip row into the database.</summary>
    public async Task CreateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        var entity = new TripEntity
        {
            TripId = trip.Id == Guid.Empty ? Guid.NewGuid(): trip.Id,
            DriverUserId = trip.DriverId,
            VehicleId = trip.VehicleId,
            Rate = trip.Rate,
            FromLocation = trip.Origin,
            ToLocation = trip.Destination,
            StartDateTime = trip.DepartureAt,
            TotalSeats = trip.TotalSeats,
            AvailableSeats = trip.AvailableSeats,
            CreatedAt = trip.CreatedAt,
            State = trip.State,
            Notes = trip.Notes
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
