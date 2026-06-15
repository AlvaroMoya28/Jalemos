// Application service for the Notifications module.
// Reads/marks notifications via the repository and handles admin broadcasts,
// push-token registration, and notification preferences against the users table.
// Push delivery itself is handled centrally by PushNotificationInterceptor, which
// fires whenever new notification rows are saved — so this service only needs to
// persist the rows.

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Application.DTOs;
using JalemosBackend.Modules.Notifications.Infrastructure;

namespace JalemosBackend.Modules.Notifications.Application;

public sealed class NotificationsService : INotificationsService
{
    private readonly NotificationsRepository _repository;
    private readonly ApplicationDbContext _db;

    public NotificationsService(NotificationsRepository repository, ApplicationDbContext db)
    {
        _repository = repository;
        _db         = db;
    }

    public Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        Guid userId, bool unreadOnly = false, int take = 50, string? mode = null, CancellationToken ct = default) =>
        _repository.GetForUserAsync(userId, unreadOnly, Math.Clamp(take, 1, 200), NormalizeMode(mode), ct);

    public Task<int> GetUnreadCountAsync(Guid userId, string? mode = null, CancellationToken ct = default) =>
        _repository.CountUnreadAsync(userId, NormalizeMode(mode), ct);

    // Only "passenger" / "driver" are valid audience filters; anything else means "no filter".
    private static string? NormalizeMode(string? mode) =>
        mode is "passenger" or "driver" ? mode : null;

    public Task<bool> MarkReadAsync(Guid id, Guid userId, CancellationToken ct = default) =>
        _repository.MarkReadAsync(id, userId, ct);

    public Task<int> MarkAllReadAsync(Guid userId, CancellationToken ct = default) =>
        _repository.MarkAllReadAsync(userId, ct);

    public Task<int> ClearAllAsync(Guid userId, CancellationToken ct = default) =>
        _repository.ClearAllAsync(userId, ct);

    public async Task<BroadcastResultDto> BroadcastAsync(BroadcastDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new ArgumentException("El título es obligatorio.");

        // Resolve recipients (admins are the senders, never recipients) and the audience
        // tag that controls which role-mode the notification shows up in.
        //  · All        → everyone non-admin, tagged "all"       (shown in any mode)
        //  · Passengers → everyone non-admin, tagged "passenger" (shown in passenger mode)
        //  · Drivers    → only drivers,       tagged "driver"    (shown in driver mode)
        var users = _db.Users.AsNoTracking()
            .Where(u => u.IsActive && u.Role != Modules.Users.Domain.UserRole.admin);

        var audience = dto.Segment switch
        {
            BroadcastSegment.Passengers => "passenger",
            BroadcastSegment.Drivers    => "driver",
            _                            => "all",
        };
        if (dto.Segment == BroadcastSegment.Drivers)
            users = users.Where(u => u.Role == Modules.Users.Domain.UserRole.driver);

        var userIds = await users.Select(u => u.UserId).ToListAsync(ct);

        foreach (var userId in userIds)
        {
            _db.Notifications.Add(new NotificationEntity
            {
                UserId   = userId,
                Type     = NotificationType.AdminBroadcast,
                Title    = dto.Title.Trim(),
                Body     = string.IsNullOrWhiteSpace(dto.Body) ? null : dto.Body.Trim(),
                Audience = audience,
            });
        }

        await _db.SaveChangesAsync(ct); // interceptor fans out push to each user with a token
        return new BroadcastResultDto { Recipients = userIds.Count };
    }

    public async Task RegisterPushTokenAsync(Guid userId, string? token, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        user.ExpoPushToken = string.IsNullOrWhiteSpace(token) ? null : token.Trim();
        await _db.SaveChangesAsync(ct);
    }

    public async Task<NotificationPrefsDto> GetPreferencesAsync(Guid userId, CancellationToken ct = default)
    {
        var json = await _db.Users.AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => u.NotificationPrefs)
            .FirstOrDefaultAsync(ct);

        return new NotificationPrefsDto { Preferences = ParsePrefs(json) };
    }

    public async Task UpdatePreferencesAsync(Guid userId, NotificationPrefsDto prefs, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");
        user.NotificationPrefs = JsonSerializer.Serialize(prefs.Preferences ?? new());
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Parses a stored prefs JSON blob into a flat string→bool map, tolerating bad data.</summary>
    public static Dictionary<string, bool> ParsePrefs(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, bool>>(json) ?? new();
        }
        catch (JsonException)
        {
            return new();
        }
    }
}
