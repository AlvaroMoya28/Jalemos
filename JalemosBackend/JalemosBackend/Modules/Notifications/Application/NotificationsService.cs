// Este archivo contiene la lógica de aplicación del módulo Notifications.
// Aquí deberían coordinarse validaciones y reglas de negocio de notificaciones.

using JalemosBackend.Modules.Notifications.Domain;
using JalemosBackend.Modules.Notifications.Infrastructure;

namespace JalemosBackend.Modules.Notifications.Application;

public sealed class NotificationsService : INotificationsService
{
    private readonly NotificationsRepository _repository;

    public NotificationsService(NotificationsRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(cancellationToken);
    }

    public Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(id, cancellationToken);
    }

    public Task CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        return _repository.CreateAsync(notification, cancellationToken);
    }

    public Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(notification, cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(id, cancellationToken);
    }
}
