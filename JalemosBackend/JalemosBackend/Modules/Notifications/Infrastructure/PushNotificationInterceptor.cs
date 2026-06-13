// EF Core SaveChanges interceptor that turns every newly-persisted in-app notification
// into an Expo push. Centralising delivery here means all existing notification triggers
// (booking received, trip boarding/started/cancelled, ratings, reminders, broadcasts…)
// get push for free — no service needs to know about push.
//
// Flow: capture the Added NotificationEntity rows in SavingChanges, then after the save
// commits, resolve each recipient's push token + preferences and dispatch (fire-and-forget).

using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using JalemosBackend.Infrastructure.Persistence;
using JalemosBackend.Modules.Notifications.Application;

namespace JalemosBackend.Modules.Notifications.Infrastructure;

public sealed class PushNotificationInterceptor : SaveChangesInterceptor
{
    // Maximum notifications retained per user. Older ones are deleted after each insert
    // so a user's history never grows unbounded (the feed only ever shows the latest 50).
    public const int RetentionLimit = 50;

    // Per-DbContext scratch space so concurrent requests don't mix their pending pushes.
    private static readonly ConditionalWeakTable<DbContext, List<PendingNotification>> Pending = new();

    private readonly IServiceScopeFactory _scopeFactory;

    public PushNotificationInterceptor(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    private sealed record PendingNotification(
        Guid UserId, NotificationType Type, string Title, string? Body, Guid? TripId, Guid? BookingId);

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        Capture(eventData.Context);
        return base.SavingChangesAsync(eventData, result, ct);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        Capture(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    private static void Capture(DbContext? ctx)
    {
        if (ctx is null) return;
        var added = ctx.ChangeTracker.Entries<NotificationEntity>()
            .Where(e => e.State == EntityState.Added)
            .Select(e => new PendingNotification(
                e.Entity.UserId, e.Entity.Type, e.Entity.Title, e.Entity.Body, e.Entity.TripId, e.Entity.BookingId))
            .ToList();
        if (added.Count > 0) Pending.AddOrUpdate(ctx, added);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken ct = default)
    {
        Flush(eventData.Context);
        return await base.SavedChangesAsync(eventData, result, ct);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Flush(eventData.Context);
        return base.SavedChanges(eventData, result);
    }

    private void Flush(DbContext? ctx)
    {
        if (ctx is null || !Pending.TryGetValue(ctx, out var list)) return;
        Pending.Remove(ctx);
        _ = DeliverAsync(list); // fire-and-forget: don't block the request on an external HTTP call
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData)
    {
        if (eventData.Context is not null) Pending.Remove(eventData.Context);
        base.SaveChangesFailed(eventData);
    }

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken ct = default)
    {
        if (eventData.Context is not null) Pending.Remove(eventData.Context);
        return base.SaveChangesFailedAsync(eventData, ct);
    }

    private async Task DeliverAsync(List<PendingNotification> pending)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db     = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var sender = scope.ServiceProvider.GetRequiredService<IExpoPushSender>();
            var repo   = scope.ServiceProvider.GetRequiredService<NotificationsRepository>();

            var userIds = pending.Select(p => p.UserId).Distinct().ToList();

            // Retention: trim each affected user back to the latest N notifications.
            foreach (var userId in userIds)
                await repo.TrimToLatestAsync(userId, RetentionLimit);
            var users = await db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.UserId) && u.ExpoPushToken != null)
                .Select(u => new { u.UserId, u.ExpoPushToken, u.NotificationPrefs })
                .ToListAsync();
            var userMap = users.ToDictionary(u => u.UserId);

            var messages = new List<ExpoPushMessage>();
            foreach (var p in pending)
            {
                if (!userMap.TryGetValue(p.UserId, out var u) || string.IsNullOrWhiteSpace(u.ExpoPushToken))
                    continue;

                // Respect opt-out for non-critical types.
                if (!NotificationMapper.CriticalTypes.Contains(p.Type))
                {
                    var prefs = NotificationsService.ParsePrefs(u.NotificationPrefs);
                    if (prefs.TryGetValue(NotificationMapper.ToSnake(p.Type), out var enabled) && !enabled)
                        continue;
                }

                messages.Add(new ExpoPushMessage(
                    u.ExpoPushToken!,
                    p.Title,
                    p.Body,
                    new { type = NotificationMapper.ToSnake(p.Type), tripId = p.TripId, bookingId = p.BookingId }));
            }

            await sender.SendAsync(messages);
        }
        catch
        {
            // Best-effort delivery — never throw from a background push attempt.
        }
    }
}
