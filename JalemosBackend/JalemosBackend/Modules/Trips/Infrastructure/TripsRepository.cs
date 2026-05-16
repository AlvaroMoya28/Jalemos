// Data access layer for the Trips module.
// All database queries for the Trip aggregate live here.
// Replace stub implementations with real EF Core calls once ApplicationDbContext is configured.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Rides.Domain;

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

    /// <summary>Fetches all trip records. Replace with <c>_dbContext.Trips.ToListAsync()</c>.</summary>
    public Task<IEnumerable<Trip>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Trip>>(Array.Empty<Trip>());
    }

    /// <summary>Finds a trip by its primary key. Returns null when not found.</summary>
    public Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Trip?>(null);
    }

    /// <summary>Inserts a new trip row into the database.</summary>
    public Task CreateAsync(Trip ride, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Trips.Add(ride); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
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
