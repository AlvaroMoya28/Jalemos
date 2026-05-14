// Este archivo define el contrato de aplicación del módulo Notifications.
// Aquí deberían declararse los casos de uso de notificaciones.

using JalemosBackend.Modules.Notifications.Domain;

namespace JalemosBackend.Modules.Notifications.Application;

public interface INotificationsService
{
    // TODO: agregar casos de uso reales para notificaciones.
    Task<IEnumerable<Notification>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CreateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
