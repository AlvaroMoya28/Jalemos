// Application contract for the Notifications module.
// Use cases here cover sending, reading, and managing in-app notifications.

using JalemosBackend.Modules.Notifications.Domain;

namespace JalemosBackend.Modules.Notifications.Application;

/// <summary>
/// Defines notification management use cases consumed by the presentation layer.
/// </summary>
public interface INotificationsService
{
    /// <summary>Retrieves all notifications (typically scoped to the authenticated user).</summary>
    Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns a single notification by id, or null if not found.</summary>
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Creates and delivers a new notification to the target user.</summary>
    Task CreateAsync(Notification notification, CancellationToken cancellationToken = default);

    /// <summary>Updates a notification (e.g., marks it as read).</summary>
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);

    /// <summary>Deletes a notification by id.</summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
