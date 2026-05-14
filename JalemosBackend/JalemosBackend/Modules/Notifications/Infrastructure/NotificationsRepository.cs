// Este archivo representa el acceso a datos del módulo Notifications.
// Aquí deberían implementarse las consultas a la base de datos compartida.

using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Domain;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

public sealed class NotificationsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public NotificationsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Notification>>(Array.Empty<Notification>());
    }

    public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Notification?>(null);
    }

    public Task CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
