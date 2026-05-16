// Data access layer for the Notifications module.
// Provides CRUD operations against the notifications table in the shared database.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Domain;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

/// <summary>
/// Executes database queries for <see cref="Notification"/> entities.
/// All methods are stubs until <see cref="ApplicationDbContext"/> exposes a real DbSet&lt;Notification&gt;.
/// </summary>
public sealed class NotificationsRepository
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>Receives the shared database context via constructor injection.</summary>
    public NotificationsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Returns all notification records. Replace with a filtered EF Core query.</summary>
    public Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Notification>>(Array.Empty<Notification>());
    }

    /// <summary>Finds a notification by primary key. Returns null if not found.</summary>
    public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Notification?>(null);
    }

    /// <summary>Persists a new notification record.</summary>
    public Task CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Notifications.Add(notification); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Updates an existing notification (e.g., marks IsRead = true).</summary>
    public Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        // TODO: _dbContext.Notifications.Update(notification); await _dbContext.SaveChangesAsync(cancellationToken);
        return Task.CompletedTask;
    }

    /// <summary>Removes the notification with the given id.</summary>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // TODO: find entity by id, call Remove(), then SaveChangesAsync
        return Task.CompletedTask;
    }
}
