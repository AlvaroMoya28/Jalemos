// Data access layer for the Bookings module.
// Translates domain operations into database queries against the shared ApplicationDbContext.
// No business logic belongs here — only raw CRUD operations.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Bookings.Domain;

namespace JalemosBackend.Modules.Bookings.Infrastructure;

/// <summary>
/// Provides persistence operations for <see cref="Booking"/> entities.
/// All methods return stub values until a real database is wired up.
/// </summary>
public sealed class BookingsRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public BookingsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Returns all bookings. Replace with a real EF Core query (e.g., _dbContext.Bookings.ToListAsync()).</summary>
    public Task<IEnumerable<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Booking>>(Array.Empty<Booking>());
    }

    /// <summary>Finds a booking by primary key. Returns null if no match is found.</summary>
    public Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Booking?>(null);
    }

    /// <summary>Inserts a new booking record into the database.</summary>
    public Task CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Bookings.Add(booking); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Updates an existing booking record.</summary>
    public Task UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Bookings.Update(booking); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Removes the booking with the given identifier from the database.</summary>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: find entity by id, remove it, then call SaveChangesAsync
        return Task.CompletedTask;
    }
}
