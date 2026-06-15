// Application contract for the Notifications module.
// Covers reading/marking in-app notifications, admin broadcasts, push-token
// registration, and per-user notification preferences.

using JalemosBackend.Modules.Notifications.Application.DTOs;

namespace JalemosBackend.Modules.Notifications.Application;

public interface INotificationsService
{
    /// <summary>Recent notifications for a user (newest first), optionally unread-only and scoped to a role-mode.</summary>
    Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        Guid userId, bool unreadOnly = false, int take = 50, string? mode = null, CancellationToken ct = default);

    /// <summary>Unread notification count for the badge, optionally scoped to a role-mode.</summary>
    Task<int> GetUnreadCountAsync(Guid userId, string? mode = null, CancellationToken ct = default);

    /// <summary>Marks a single notification as read. Returns false if not found for this user.</summary>
    Task<bool> MarkReadAsync(Guid id, Guid userId, CancellationToken ct = default);

    /// <summary>Marks all of the user's notifications as read. Returns the count updated.</summary>
    Task<int> MarkAllReadAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Deletes all of the user's notifications. Returns the count removed.</summary>
    Task<int> ClearAllAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Admin: sends an announcement to a segment of users (in-app + push).</summary>
    Task<BroadcastResultDto> BroadcastAsync(BroadcastDto dto, CancellationToken ct = default);

    /// <summary>Stores (or clears) this user's Expo push token.</summary>
    Task RegisterPushTokenAsync(Guid userId, string? token, CancellationToken ct = default);

    /// <summary>Returns the user's notification opt-in/out preferences.</summary>
    Task<NotificationPrefsDto> GetPreferencesAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Replaces the user's notification preferences.</summary>
    Task UpdatePreferencesAsync(Guid userId, NotificationPrefsDto prefs, CancellationToken ct = default);
}
