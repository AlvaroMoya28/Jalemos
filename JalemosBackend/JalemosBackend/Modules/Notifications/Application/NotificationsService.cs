// Application service for the Notifications module.
// Coordinates notification delivery logic and delegates storage to NotificationsRepository.
// Future work: integrate a push notification provider (FCM/APNs) in CreateAsync.

using JalemosBackend.Modules.Notifications.Domain;
using JalemosBackend.Modules.Notifications.Infrastructure;

namespace JalemosBackend.Modules.Notifications.Application;

/// <summary>
/// Implements notification use cases defined in <see cref="INotificationsService"/>.
/// </summary>
public sealed class NotificationsService : INotificationsService
{
    private readonly NotificationsRepository _repository;

    /// <summary>Injects the notifications data access repository.</summary>
    public NotificationsService(NotificationsRepository repository)
    {
        _repository = repository;
    }

    /// <inheritdoc/>
    public Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // TODO: filter by the authenticated user's id once auth is implemented
        return _repository.GetAllAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public Task CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        // TODO: send a push notification via FCM/APNs after persisting the record
        return _repository.CreateAsync(notification, cancellationToken);
    }

    /// <inheritdoc/>
    public Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(notification, cancellationToken);
    }

    /// <inheritdoc/>
    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
