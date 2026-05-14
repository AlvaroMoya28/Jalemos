// Este archivo expone los endpoints HTTP del módulo Notifications.
// Aquí debería traducirse la API REST a casos de uso de aplicación.

using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Notifications.Presentation;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationsService _notificationsService;

    public NotificationsController(INotificationsService notificationsService)
    {
        _notificationsService = notificationsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetAll(CancellationToken cancellationToken)
    {
        var notifications = await _notificationsService.GetAllAsync(cancellationToken);
        return Ok(notifications);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Notification>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var notification = await _notificationsService.GetByIdAsync(id, cancellationToken);
        return notification is null ? NotFound() : Ok(notification);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Notification notification, CancellationToken cancellationToken)
    {
        await _notificationsService.CreateAsync(notification, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Notification notification, CancellationToken cancellationToken)
    {
        notification.Id = id;
        await _notificationsService.UpdateAsync(notification, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _notificationsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
