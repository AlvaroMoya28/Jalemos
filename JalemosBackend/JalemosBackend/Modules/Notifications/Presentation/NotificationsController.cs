// HTTP presentation layer for the Notifications module.
// Translates REST requests into INotificationsService calls and returns proper HTTP status codes.

using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Domain;
using Microsoft.AspNetCore.Mvc;

namespace JalemosBackend.Modules.Notifications.Presentation;

/// <summary>
/// Exposes CRUD endpoints for notifications under the /api/notifications route.
/// </summary>
[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationsService _notificationsService;

    /// <summary>Injects the notifications application service.</summary>
    public NotificationsController(INotificationsService notificationsService)
    {
        _notificationsService = notificationsService;
    }

    /// <summary>GET /api/notifications — retrieves all notifications for the current user.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetAll(CancellationToken cancellationToken)
    {
        var notifications = await _notificationsService.GetAllAsync(cancellationToken);
        return Ok(notifications);
    }

    /// <summary>GET /api/notifications/{id} — returns a single notification. 404 if not found.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Notification>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var notification = await _notificationsService.GetByIdAsync(id, cancellationToken);
        return notification is null ? NotFound() : Ok(notification);
    }

    /// <summary>POST /api/notifications — creates and delivers a new notification.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Notification notification, CancellationToken cancellationToken)
    {
        await _notificationsService.CreateAsync(notification, cancellationToken);
        return NoContent();
    }

    /// <summary>PUT /api/notifications/{id} — updates a notification (e.g., mark as read). Route id overrides body id.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Notification notification, CancellationToken cancellationToken)
    {
        // Enforce the route id so the primary key cannot be changed via the request body
        notification.Id = id;
        await _notificationsService.UpdateAsync(notification, cancellationToken);
        return NoContent();
    }

    /// <summary>DELETE /api/notifications/{id} — removes the specified notification.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _notificationsService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
