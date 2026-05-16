// Data access layer for the Ratings module.
// Executes all database queries for the Rating aggregate against the shared context.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Ratings.Domain;

namespace JalemosBackend.Modules.Ratings.Infrastructure;

/// <summary>
/// Provides raw CRUD operations for <see cref="Rating"/> entities.
/// All methods return stubs until <see cref="ApplicationDbContext"/> exposes DbSet&lt;Rating&gt;.
/// </summary>
public sealed class RatingsRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public RatingsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Returns all rating records. Replace with a filtered EF Core query.</summary>
    public Task<IEnumerable<Rating>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Rating>>(Array.Empty<Rating>());
    }

    /// <summary>Finds a rating by primary key. Returns null if not found.</summary>
    public Task<Rating?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Rating?>(null);
    }

    /// <summary>Inserts a new rating record into the database.</summary>
    public Task CreateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Ratings.Add(rating); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Updates an existing rating record.</summary>
    public Task UpdateAsync(Rating rating, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Ratings.Update(rating); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Removes the rating with the given id from the database.</summary>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: find entity by id, call Remove(), then SaveChangesAsync
        return Task.CompletedTask;
    }
}
