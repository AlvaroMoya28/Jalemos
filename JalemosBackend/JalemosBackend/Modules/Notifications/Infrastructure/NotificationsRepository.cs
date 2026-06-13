// Data access for the Notifications module. Reads/writes the shared `notifications` table
// scoped to a single user, and exposes unread-count and mark-read operations.

using Microsoft.EntityFrameworkCore;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Application.DTOs;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

public sealed class NotificationsRepository
{
    private readonly ApplicationDbContext _db;

    public NotificationsRepository(ApplicationDbContext db) => _db = db;

    // Restricts a query to notifications visible in the given role-mode: always the
    // "all" audience, plus the audience matching the current mode. A null/blank mode
    // disables the filter (returns everything).
    private static IQueryable<NotificationEntity> ApplyAudience(
        IQueryable<NotificationEntity> query, string? mode) =>
        string.IsNullOrWhiteSpace(mode)
            ? query
            : query.Where(n => n.Audience == "all" || n.Audience == mode);

    /// <summary>Most recent notifications for a user, newest first. Optionally only unread / by mode.</summary>
    public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        Guid userId, bool unreadOnly, int take, string? mode = null, CancellationToken ct = default)
    {
        var query = _db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        if (unreadOnly) query = query.Where(n => !n.Read);
        query = ApplyAudience(query, mode);

        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .ToListAsync(ct);

        return rows.Select(NotificationMapper.ToDto).ToList();
    }

    /// <summary>Number of unread notifications for the badge counter, optionally scoped to a mode.</summary>
    public Task<int> CountUnreadAsync(Guid userId, string? mode = null, CancellationToken ct = default)
    {
        var query = _db.Notifications.Where(n => n.UserId == userId && !n.Read);
        query = ApplyAudience(query, mode);
        return query.CountAsync(ct);
    }

    /// <summary>Marks one notification read. Returns false if it doesn't exist or isn't the user's.</summary>
    public async Task<bool> MarkReadAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == id && x.UserId == userId, ct);
        if (n is null) return false;
        if (!n.Read)
        {
            n.Read = true;
            await _db.SaveChangesAsync(ct);
        }
        return true;
    }

    /// <summary>Marks every unread notification of a user as read. Returns how many were updated.</summary>
    public async Task<int> MarkAllReadAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _db.Notifications.Where(n => n.UserId == userId && !n.Read).ToListAsync(ct);
        foreach (var n in rows) n.Read = true;
        if (rows.Count > 0) await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    /// <summary>Deletes all of a user's notifications (the "clear" action). Returns how many were removed.</summary>
    public Task<int> ClearAllAsync(Guid userId, CancellationToken ct = default) =>
        _db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync(ct);

    /// <summary>
    /// Retention: keeps only the newest <paramref name="keep"/> notifications for a user and
    /// deletes the rest, so a user's history never grows unbounded.
    /// </summary>
    public async Task TrimToLatestAsync(Guid userId, int keep, CancellationToken ct = default)
    {
        var idsToDelete = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => n.NotificationId)
            .Skip(keep)
            .ToListAsync(ct);

        if (idsToDelete.Count > 0)
            await _db.Notifications.Where(n => idsToDelete.Contains(n.NotificationId)).ExecuteDeleteAsync(ct);
    }
}
