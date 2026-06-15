// HTTP layer for the Notifications module.
// Exposes the authenticated user's notification feed, unread count, mark-read
// actions, push-token registration, per-user preferences, and the admin broadcast.

using JalemosBackend.Modules.Notifications.Application;
using JalemosBackend.Modules.Notifications.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JalemosBackend.Modules.Notifications.Presentation;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationsService _svc;

    public NotificationsController(INotificationsService svc) => _svc = svc;

    private Guid? CallerId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
            ? id : null;

    /// <summary>GET /api/notifications — the current user's notifications (newest first).
    /// Pass mode=passenger|driver to only see that role-mode's notifications (plus "all").</summary>
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false, [FromQuery] int take = 50,
        [FromQuery] string? mode = null, CancellationToken ct = default)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        var items = await _svc.GetForUserAsync(userId.Value, unreadOnly, take, mode, ct);
        return Ok(items);
    }

    /// <summary>GET /api/notifications/unread-count — unread count for the badge, optionally scoped to a mode.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount([FromQuery] string? mode = null, CancellationToken ct = default)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        return Ok(new { count = await _svc.GetUnreadCountAsync(userId.Value, mode, ct) });
    }

    /// <summary>PATCH /api/notifications/{id}/read — mark a single notification as read.</summary>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        var ok = await _svc.MarkReadAsync(id, userId.Value, ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>PATCH /api/notifications/read-all — mark all of the user's notifications as read.</summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        var updated = await _svc.MarkAllReadAsync(userId.Value, ct);
        return Ok(new { updated });
    }

    /// <summary>DELETE /api/notifications — clears all of the user's notifications.</summary>
    [HttpDelete]
    public async Task<IActionResult> ClearAll(CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        var deleted = await _svc.ClearAllAsync(userId.Value, ct);
        return Ok(new { deleted });
    }

    /// <summary>POST /api/notifications/push-token — register/refresh this device's Expo push token.</summary>
    [HttpPost("push-token")]
    public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenDto dto, CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        await _svc.RegisterPushTokenAsync(userId.Value, dto.Token, ct);
        return NoContent();
    }

    /// <summary>GET /api/notifications/preferences — the user's opt-in/out map.</summary>
    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences(CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        return Ok(await _svc.GetPreferencesAsync(userId.Value, ct));
    }

    /// <summary>PUT /api/notifications/preferences — replace the user's opt-in/out map.</summary>
    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] NotificationPrefsDto prefs, CancellationToken ct)
    {
        var userId = CallerId();
        if (userId is null) return Unauthorized();
        await _svc.UpdatePreferencesAsync(userId.Value, prefs, ct);
        return NoContent();
    }

    /// <summary>POST /api/notifications/broadcast — admin announcement to a user segment.</summary>
    [HttpPost("broadcast")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _svc.BroadcastAsync(dto, ct);
            return Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
